<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class ProductDatatableService
{
    /**
     * Get the starting query with pre-loaded relations, search, and sorting filters.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = Product::query()->with('businesses');

        // Scope by permission
        $query->when($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT), function (Builder $q) {
            // No filter
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PRODUCT) && $user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT), function (Builder $q) use ($user) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $q->whereHas('businesses', function ($sub) use ($associatedBusinessIds) {
                $sub->whereIn('businesses.id', $associatedBusinessIds);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PRODUCT) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT) && $user->hasPermission(UserPermission::VIEW_OWN_PRODUCT), function (Builder $q) use ($user) {
            $q->whereHas('businesses', function ($sub) use ($user) {
                $sub->where('user_id', $user->id);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PRODUCT) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT) && !$user->hasPermission(UserPermission::VIEW_OWN_PRODUCT), function (Builder $q) {
            $q->whereRaw('1 = 0');
        });

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Apply global search via when()
        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhereHas('businesses', function (Builder $businessQ) use ($search) {
                        $businessQ->where('name', 'like', "%{$search}%");
                    });
            });
        });

        // Apply individual column searches via when()
        $query->when($request->input('name'), function (Builder $q, $name) {
            $q->where('name', 'like', "%{$name}%");
        })->when($request->input('business'), function (Builder $q, $businessName) {
            $q->whereHas('businesses', function (Builder $businessQ) use ($businessName) {
                $businessQ->where('name', 'like', "%{$businessName}%");
            });
        });

        // Apply sorting via when()
        $query->when($sortField, function (Builder $q) use ($sortField, $sortOrder) {
            $q->orderBy($sortField, $sortOrder);
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
            $businessNames = $row->businesses->pluck('name')->implode(', ');
            $item = [
                'No' => $index + 1,
                'Nama Produk' => $row->name,
                'Bisnis Terkait' => $businessNames ?: '-',
                'Tanggal Dibuat' => $row->created_at ? $row->created_at->format('Y-m-d H:i:s') : '-',
            ];

            $mappedData->push($item);
        }

        $filename = 'Rekapan Data Produk Per ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export the query data to PDF format.
     */
    public function printPdf(DatatableRequest $request)
    {
        $products = $this->getStartedQuery($request->user(), $request)->get();

        $pdf = Pdf::loadView('pdf.products', compact('products'));
        $filename = 'Rekapan Data Produk Per ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
