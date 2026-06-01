<?php

namespace App\Services;

use App\Models\ProductUnit;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class ProductUnitDatatableService
{
    /**
     * Get the starting query with pre-loaded relations, search, and sorting filters.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = ProductUnit::query()->with('business');

        // Scope by permission
        $query->when($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_UNIT), function (Builder $q) {
            // No filter
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_UNIT) && $user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT), function (Builder $q) use ($user) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $q->whereIn('business_id', $associatedBusinessIds);
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_UNIT) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT) && $user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_UNIT), function (Builder $q) use ($user) {
            $q->whereHas('business', function ($sub) use ($user) {
                $sub->where('user_id', $user->id);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_UNIT) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT) && !$user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_UNIT), function (Builder $q) {
            $q->whereRaw('1 = 0');
        });

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Apply global search via when()
        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('short_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('business', function (Builder $businessQ) use ($search) {
                        $businessQ->where('name', 'like', "%{$search}%");
                    });
            });
        });

        // Apply individual column searches via when()
        $query->when($request->input('name'), function (Builder $q, $name) {
            $q->where('name', 'like', "%{$name}%");
        })->when($request->input('short_name'), function (Builder $q, $shortName) {
            $q->where('short_name', 'like', "%{$shortName}%");
        })->when($request->input('description'), function (Builder $q, $description) {
            $q->where('description', 'like', "%{$description}%");
        })->when($request->input('business'), function (Builder $q, $businessName) {
            $q->whereHas('business', function (Builder $businessQ) use ($businessName) {
                $businessQ->where('name', 'like', "%{$businessName}%");
            });
        });

        // Apply sorting via when()
        $query->when($sortField, function (Builder $q) use ($sortField, $sortOrder) {
            if ($sortField === 'business') {
                $q->join('businesses', 'product_units.business_id', '=', 'businesses.id')
                  ->orderBy('businesses.name', $sortOrder)
                  ->select('product_units.*');
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
        return $this->getStartedQuery($request->user(), $request)->paginate($perPage);
    }

    /**
     * Export the query data to Excel format.
     */
    public function printExcel(DatatableRequest $request)
    {
        $data = $this->getStartedQuery($request->user(), $request)->get();
        
        $mappedData = collect();
        foreach ($data as $index => $row) {
            $businessName = $row->business ? $row->business->name : '-';
            $item = [
                'No' => $index + 1,
                'Nama Satuan' => $row->name,
                'Nama Pendek' => $row->short_name,
                'Deskripsi' => $row->description ?: '-',
                'Ijinkan Desimal' => $row->allow_decimal ? 'Ya' : 'Tidak',
                'Bisnis Terkait' => $businessName,
                'Tanggal Dibuat' => $row->created_at ? $row->created_at->format('Y-m-d H:i:s') : '-',
            ];

            $mappedData->push($item);
        }

        $filename = 'Rekapan Data Satuan Produk Per ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export the query data to PDF format.
     */
    public function printPdf(DatatableRequest $request)
    {
        $units = $this->getStartedQuery($request->user(), $request)->get();

        $pdf = Pdf::loadView('pdf.product_units', compact('units'));
        $filename = 'Rekapan Data Satuan Produk Per ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
