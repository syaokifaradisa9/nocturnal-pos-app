<?php

namespace App\Services;

use App\Models\Business;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class BusinessDatatableService
{
    /**
     * Get the starting query with pre-loaded relations, search, and sorting filters.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = Business::query();

        // Scope by permission using when()
        $query->when($user->hasPermission(UserPermission::VIEW_ANY_BUSINESS), function (Builder $q) {
            $q->with('owner');
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_BUSINESS) && $user->hasPermission(UserPermission::VIEW_OWN_BUSINESS), function (Builder $q) use ($user) {
            $q->where('user_id', $user->id)->with('owner');
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_BUSINESS) && !$user->hasPermission(UserPermission::VIEW_OWN_BUSINESS), function (Builder $q) {
            $q->whereRaw('1 = 0');
        });

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Apply global search via when()
        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('owner', function (Builder $ownerQ) use ($search) {
                        $ownerQ->where('name', 'like', "%{$search}%");
                    });
            });
        });

        // Apply individual column searches via when()
        $query->when($request->input('name'), function (Builder $q, $name) {
            $q->where('name', 'like', "%{$name}%");
        })->when($request->input('description'), function (Builder $q, $description) {
            $q->where('description', 'like', "%{$description}%");
        })->when($request->input('owner'), function (Builder $q, $owner) {
            $q->whereHas('owner', function (Builder $ownerQ) use ($owner) {
                $ownerQ->where('name', 'like', "%{$owner}%");
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
        $hasOverall = $request->user()->hasPermission(UserPermission::VIEW_ANY_BUSINESS);
        $data = $this->getStartedQuery($request->user(), $request)->get();
        
        $mappedData = collect();
        foreach ($data as $index => $row) {
            $item = [
                'No' => $index + 1,
            ];
            
            if ($hasOverall) {
                $item['Owner'] = $row->owner ? $row->owner->name : 'Global';
            }

            $item['Nama Bisnis'] = $row->name;
            $item['Deskripsi'] = $row->description ?? '-';
            $item['Tanggal Dibuat'] = $row->created_at ? $row->created_at->format('Y-m-d H:i:s') : '-';

            $mappedData->push($item);
        }

        $filename = 'Rekapan Data Bisnis Per ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export the query data to PDF format.
     */
    public function printPdf(DatatableRequest $request)
    {
        $businesses = $this->getStartedQuery($request->user(), $request)->get();
        $hasOverall = $request->user()->hasPermission(UserPermission::VIEW_ANY_BUSINESS);

        $pdf = Pdf::loadView('pdf.businesses', compact('businesses', 'hasOverall'));
        $filename = 'Rekapan Data Bisnis Per ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
