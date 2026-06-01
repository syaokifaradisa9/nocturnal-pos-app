<?php

namespace App\Services;

use App\Models\ProductItem;
use App\Models\Product;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;
class ProductItemDatatableService
{
    /**
     * Get the starting query with pre-loaded relations, search, and sorting filters.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = ProductItem::query()
            ->with(['product.businesses', 'measurements.measurementUnit', 'measurements.targetMeasurementUnit', 'measurements.priceTierings']);

        // Scope by permission
        $query->when($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_ITEM), function (Builder $q) {
            // No filter
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_ITEM) && $user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_ITEM), function (Builder $q) use ($user) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $q->whereHas('product.businesses', function ($sub) use ($associatedBusinessIds) {
                $sub->whereIn('businesses.id', $associatedBusinessIds);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_ITEM) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_ITEM) && $user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_ITEM), function (Builder $q) use ($user) {
            $q->whereHas('product.businesses', function ($sub) use ($user) {
                $sub->where('user_id', $user->id);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_ITEM) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_ITEM) && !$user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_ITEM), function (Builder $q) {
            $q->whereRaw('1 = 0');
        });

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Apply global search via when()
        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('product_items.name', 'like', "%{$search}%")
                    ->orWhereHas('product', function (Builder $prodQ) use ($search) {
                        $prodQ->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('product.businesses', function (Builder $businessQ) use ($search) {
                        $businessQ->where('name', 'like', "%{$search}%");
                    });
            });
        });

        // Apply individual column searches via when()
        $query->when($request->input('name'), function (Builder $q, $name) {
            $q->where('product_items.name', 'like', "%{$name}%");
        })->when($request->input('business'), function (Builder $q, $businessName) {
            $q->whereHas('product.businesses', function (Builder $businessQ) use ($businessName) {
                $businessQ->where('name', 'like', "%{$businessName}%");
            });
        });

        // Apply sorting via when()
        $query->when($sortField, function (Builder $q) use ($sortField, $sortOrder) {
            if ($sortField === 'name') {
                $q->orderBy('product_items.name', $sortOrder);
            } else {
                $q->orderBy($sortField, $sortOrder);
            }
        });

        return $query;
    }

    /**
     * Handle the datatable query and return paginated, searched results.
     */
    public function getDatatable(DatatableRequest $request)
    {
        $perPage = $request->validated('limit') ?? 10;
        $paginator = $this->getStartedQuery($request->user(), $request)->paginate($perPage);

        $paginator->getCollection()->transform(function ($row) {
            $row->items = $row->measurements->map(function ($m) {
                return [
                    'id' => $m->id,
                    'product_item_id' => $m->product_item_id,
                    'measurement_unit_id' => $m->measurement_unit_id,
                    'target_measurement_unit_id' => $m->target_measurement_unit_id,
                    'is_base_unit' => $m->is_base_unit,
                    'conversion_rate' => $m->conversion_rate,
                    'measurement_unit' => $m->measurementUnit,
                    'target_measurement_unit' => $m->targetMeasurementUnit,
                    'price_tierings' => $m->priceTierings,
                ];
            });
            $row->businesses = $row->product ? $row->product->businesses : collect();
            return $row;
        });

        return $paginator;
    }

    /**
     * Export the query data to Excel format.
     */
    public function printExcel(DatatableRequest $request)
    {
        $data = $this->getStartedQuery($request->user(), $request)->get();
        
        $mappedData = collect();
        foreach ($data as $index => $row) {
            $businesses = $row->product ? $row->product->businesses : collect();
            $businessNames = $businesses->pluck('name')->implode(', ');
            
            $itemsText = $row->measurements->map(function ($m) {
                $unit = $m->measurementUnit ? $m->measurementUnit->short_name : 'Unit';
                $rate = floatval($m->conversion_rate);
                if ($m->is_base_unit) {
                    return "{$unit} (Base)";
                }
                if ($m->targetMeasurementUnit) {
                    $targetUnit = $m->targetMeasurementUnit->short_name;
                    return "{$unit}: {$rate} {$targetUnit}";
                }
                return "{$unit}: {$rate}";
            })->implode(', ');

            $item = [
                'No' => $index + 1,
                'Nama Varian Item' => $row->name,
                'Daftar Unit Kemasan' => $itemsText ?: '-',
                'Bisnis Terkait' => $businessNames ?: '-',
                'Tanggal Dibuat' => $row->created_at ? $row->created_at->format('Y-m-d H:i:s') : '-',
            ];

            $mappedData->push($item);
        }

        $filename = 'Rekapan Data Item Produk Per ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export the query data to PDF format.
     */
    public function printPdf(DatatableRequest $request)
    {
        $productItems = $this->getStartedQuery($request->user(), $request)->get();

        $productItems->transform(function ($row) {
            $row->items = $row->measurements->map(function ($m) {
                return (object)[
                    'id' => $m->id,
                    'product_item_id' => $m->product_item_id,
                    'measurement_unit_id' => $m->measurement_unit_id,
                    'target_measurement_unit_id' => $m->target_measurement_unit_id,
                    'is_base_unit' => $m->is_base_unit,
                    'conversion_rate' => $m->conversion_rate,
                    'measurementUnit' => $m->measurementUnit,
                    'targetMeasurementUnit' => $m->targetMeasurementUnit,
                    'priceTierings' => $m->priceTierings,
                ];
            });
            $row->businesses = $row->product ? $row->product->businesses : collect();
            return $row;
        });

        $pdf = Pdf::loadView('pdf.product_items', ['products' => $productItems]);
        $filename = 'Rekapan Data Item Produk Per ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
