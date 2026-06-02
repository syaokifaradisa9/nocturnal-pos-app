<?php

namespace App\Services;

use App\Models\Supplier;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class SupplierDatatableService
{
    /**
     * Get the starting query with pre-loaded relations, search, and sorting filters.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = Supplier::query()->with('businesses');

        // Scope by permission
        $query->when($user->hasPermission(UserPermission::VIEW_ANY_SUPPLIER), function (Builder $q) {
            // No filter
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_SUPPLIER) && $user->hasPermission(UserPermission::VIEW_ASSOCIATED_SUPPLIER), function (Builder $q) use ($user) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $q->whereHas('businesses', function ($sub) use ($associatedBusinessIds) {
                $sub->whereIn('businesses.id', $associatedBusinessIds);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_SUPPLIER) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_SUPPLIER) && $user->hasPermission(UserPermission::VIEW_OWN_SUPPLIER), function (Builder $q) use ($user) {
            $q->whereHas('businesses', function ($sub) use ($user) {
                $sub->where('user_id', $user->id);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_SUPPLIER) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_SUPPLIER) && !$user->hasPermission(UserPermission::VIEW_OWN_SUPPLIER), function (Builder $q) {
            $q->whereRaw('1 = 0');
        });

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Apply global search via when()
        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('contact_phone', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('businesses', function (Builder $businessQ) use ($search) {
                        $businessQ->where('name', 'like', "%{$search}%");
                    });
            });
        });

        // Apply individual column searches via when()
        $query->when($request->input('name'), function (Builder $q, $name) {
            $q->where('name', 'like', "%{$name}%");
        })->when($request->input('contact_name'), function (Builder $q, $contactName) {
            $q->where('contact_name', 'like', "%{$contactName}%");
        })->when($request->input('contact_phone'), function (Builder $q, $contactPhone) {
            $q->where('contact_phone', 'like', "%{$contactPhone}%");
        })->when($request->input('address'), function (Builder $q, $address) {
            $q->where('address', 'like', "%{$address}%");
        })->when($request->input('description'), function (Builder $q, $description) {
            $q->where('description', 'like', "%{$description}%");
        })->when($request->input('business'), function (Builder $q, $businessName) {
            $q->whereHas('businesses', function (Builder $businessQ) use ($businessName) {
                $businessQ->where('name', 'like', "%{$businessName}%");
            });
        });

        // Apply sorting via when()
        $query->when($sortField, function (Builder $q) use ($sortField, $sortOrder) {
            if ($sortField === 'business') {
                $q->leftJoin('business_suppliers', 'suppliers.id', '=', 'business_suppliers.supplier_id')
                  ->leftJoin('businesses', 'business_suppliers.business_id', '=', 'businesses.id')
                  ->select('suppliers.*')
                  ->groupBy('suppliers.id', 'suppliers.name', 'suppliers.contact_name', 'suppliers.contact_phone', 'suppliers.address', 'suppliers.description', 'suppliers.created_at', 'suppliers.updated_at', 'suppliers.deleted_at')
                  ->orderBy('businesses.name', $sortOrder);
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
            $businessNames = $row->businesses->pluck('name')->implode(', ');
            $item = [
                'No' => $index + 1,
                'Nama Supplier' => $row->name,
                'Nama Kontak' => $row->contact_name ?: '-',
                'Telepon Kontak' => $row->contact_phone ?: '-',
                'Alamat' => $row->address ?: '-',
                'Deskripsi' => $row->description ?: '-',
                'Bisnis Terkait' => $businessNames ?: '-',
                'Tanggal Dibuat' => $row->created_at ? $row->created_at->format('Y-m-d H:i:s') : '-',
            ];

            $mappedData->push($item);
        }

        $filename = 'Rekapan Data Supplier Per ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export the query data to PDF format.
     */
    public function printPdf(DatatableRequest $request)
    {
        $suppliers = $this->getStartedQuery($request->user(), $request)->get();

        $pdf = Pdf::loadView('pdf.suppliers', compact('suppliers'));
        $filename = 'Rekapan Data Supplier Per ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
