<?php

namespace App\Services;

use App\Models\User;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class UserDatatableService
{
    private function getStartedQuery(DatatableRequest $request): Builder
    {
        $query = User::query()->with(['businesses', 'branches']);

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Apply global search via when()
        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhereHas('businesses', function (Builder $bQ) use ($search) {
                        $bQ->where('name', 'like', "%{$search}%");
                    });
            });
        });

        // Apply individual column searches via when()
        $query->when($request->input('name'), function (Builder $q, $name) {
            $q->where('name', 'like', "%{$name}%");
        })->when($request->input('email'), function (Builder $q, $email) {
            $q->where('email', 'like', "%{$email}%");
        })->when($request->input('username'), function (Builder $q, $username) {
            $q->where('username', 'like', "%{$username}%");
        })->when($request->input('phone'), function (Builder $q, $phone) {
            $q->where('phone', 'like', "%{$phone}%");
        })->when($request->input('business_name'), function (Builder $q, $bName) {
            $q->whereHas('businesses', function (Builder $bQ) use ($bName) {
                $bQ->where('name', 'like', "%{$bName}%");
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
        $paginator = $this->getStartedQuery($request)->paginate($perPage);

        return $paginator->through(function ($row) {
            $firstBusiness = $row->businesses->first();
            $firstBranch = $row->branches->first();

            // Resolve account type based on their permissions
            $accountType = 'pebisnis';
            if ($row->hasPermission(\App\Enums\UserPermission::VIEW_OWN_BUSINESS->value)) {
                $accountType = 'pebisnis';
            } elseif ($row->hasPermission(\App\Enums\UserPermission::VIEW_OWN_BRANCH->value)) {
                $accountType = 'owner_bisnis';
            } elseif ($row->hasPermission(\App\Enums\UserPermission::VIEW_OWN_PRODUCT->value)) {
                $accountType = 'owner_cabang';
            }

            return [
                'id' => $row->id,
                'name' => $row->name,
                'email' => $row->email,
                'username' => $row->username,
                'address' => $row->address,
                'phone' => $row->phone,
                'business_name' => $firstBusiness ? $firstBusiness->name : '—',
                'business_description' => $firstBusiness ? $firstBusiness->description : '',
                'branch_name' => $firstBranch ? $firstBranch->name : '—',
                'branch_address' => $firstBranch ? $firstBranch->address : '',
                'branch_opening_time' => $firstBranch ? $firstBranch->opening_time : '',
                'branch_end_time' => $firstBranch ? $firstBranch->end_time : '',
                'account_type' => $accountType,
            ];
        });
    }

    /**
     * Export the query data to Excel format.
     */
    public function printExcel(DatatableRequest $request)
    {
        $data = $this->getStartedQuery($request)->get();
        
        $mappedData = collect();
        foreach ($data as $index => $row) {
            $firstBusiness = $row->businesses->first();
            $item = [
                'No' => $index + 1,
                'Nama' => $row->name,
                'Email' => $row->email,
                'Username' => $row->username ?? '-',
                'Telepon' => $row->phone ?? '-',
                'Alamat' => $row->address ?? '-',
                'Bisnis' => $firstBusiness ? $firstBusiness->name : '-',
                'Deskripsi Bisnis' => $firstBusiness ? ($firstBusiness->description ?? '-') : '-',
                'Tanggal Dibuat' => $row->created_at ? $row->created_at->format('Y-m-d H:i:s') : '-',
            ];

            $mappedData->push($item);
        }

        $filename = 'Rekapan Data User Per ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export/Print to PDF.
     */
    public function printPdf(DatatableRequest $request)
    {
        $users = $this->getStartedQuery($request)->get();

        $pdf = Pdf::loadView('pdf.users', compact('users'));
        $filename = 'Rekapan Data User Per ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
