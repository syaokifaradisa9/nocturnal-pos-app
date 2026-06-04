<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class BranchDatatableService
{
    /**
     * Get the starting query with pre-loaded relations, search, and sorting filters.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = Branch::whereHas('business')->with(['business.owner', 'business.users']);

        // Scope by permission
        $query->when($user->hasPermission(UserPermission::VIEW_ANY_BRANCH), function (Builder $q) {
            // No filter
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_BRANCH) && $user->hasPermission(UserPermission::VIEW_ASSOCIATED_BRANCH), function (Builder $q) use ($user) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $q->whereIn('business_id', $associatedBusinessIds);
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_BRANCH) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_BRANCH) && $user->hasPermission(UserPermission::VIEW_OWN_BRANCH), function (Builder $q) use ($user) {
            $q->whereHas('business', function ($sub) use ($user) {
                $sub->where('user_id', $user->id);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_BRANCH) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_BRANCH) && !$user->hasPermission(UserPermission::VIEW_OWN_BRANCH), function (Builder $q) {
            $q->whereRaw('1 = 0');
        });

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Apply global search via when() based on permission
        $query->when($search, function (Builder $q) use ($search, $user) {
            $q->where(function (Builder $sub) use ($search, $user) {
                if ($user->hasPermission(UserPermission::VIEW_ANY_BRANCH)) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('opening_time', 'like', "%{$search}%")
                        ->orWhere('end_time', 'like', "%{$search}%")
                        ->orWhereHas('business', function (Builder $businessQ) use ($search) {
                            $businessQ->where('name', 'like', "%{$search}%");
                        });
                } elseif ($user->hasPermission(UserPermission::VIEW_OWN_BRANCH)) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('opening_time', 'like', "%{$search}%")
                        ->orWhere('end_time', 'like', "%{$search}%")
                        ->orWhereHas('business', function (Builder $businessQ) use ($search) {
                            $businessQ->where('name', 'like', "%{$search}%");
                        });
                } elseif ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_BRANCH)) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('opening_time', 'like', "%{$search}%")
                        ->orWhere('end_time', 'like', "%{$search}%");
                }
            });
        });

        // Apply individual column searches via when()
        $query->when($request->input('name'), function (Builder $q, $name) {
            $q->where('name', 'like', "%{$name}%");
        })->when($request->input('address'), function (Builder $q, $address) {
            $q->where('address', 'like', "%{$address}%");
        })->when($request->input('business') ?? $request->input('business_name'), function (Builder $q, $businessName) {
            $q->whereHas('business', function (Builder $businessQ) use ($businessName) {
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
        $paginator = $this->getStartedQuery($request->user(), $request)->paginate($perPage);

        $user = $request->user();
        $hasOverall = $user->hasPermission(UserPermission::VIEW_ANY_BRANCH);
        $hasAssoc = !$hasOverall && $user->hasPermission(UserPermission::VIEW_ASSOCIATED_BRANCH);

        return $paginator->through(function ($row) use ($user, $hasOverall, $hasAssoc) {
            if ($hasOverall) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'address' => $row->address,
                    'opening_time' => $row->opening_time,
                    'end_time' => $row->end_time,
                    'business_name' => $row->business ? $row->business->name : null,
                    'business_id' => $row->business_id,
                    'owner_id' => $row->business ? $row->business->user_id : null,
                    'owner_name' => ($row->business && $row->business->owner) ? $row->business->owner->name : 'Global',
                ];
            } elseif ($hasAssoc) {
                $responsibleUser = $row->business ? $row->business->users->firstWhere('id', $user->id) : null;
                $responsibleUserId = $responsibleUser ? $responsibleUser->id : null;
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'address' => $row->address,
                    'opening_time' => $row->opening_time,
                    'end_time' => $row->end_time,
                    'responsible_user_id' => $responsibleUserId,
                ];
            } else {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'address' => $row->address,
                    'opening_time' => $row->opening_time,
                    'end_time' => $row->end_time,
                    'business_id' => $row->business_id,
                    'business_name' => $row->business ? $row->business->name : null,
                    'owner_id' => $row->business ? $row->business->user_id : null,
                ];
            }
        });
    }

    /**
     * Export the query data to Excel format.
     */
    public function printExcel(DatatableRequest $request)
    {
        $data = $this->getStartedQuery($request->user(), $request)->get();
        
        $mappedData = collect();
        foreach ($data as $index => $row) {
            $item = [
                'No' => $index + 1,
                'Nama Cabang' => $row->name,
                'Alamat' => $row->address,
                'Jam Buka' => $row->opening_time ?? '-',
                'Jam Tutup' => $row->end_time ?? '-',
                'Bisnis' => $row->business ? $row->business->name : '-',
                'Tanggal Dibuat' => $row->created_at ? $row->created_at->format('Y-m-d H:i:s') : '-',
            ];

            $mappedData->push($item);
        }

        $filename = 'Rekapan Data Cabang Per ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export the query data to PDF format.
     */
    public function printPdf(DatatableRequest $request)
    {
        $branches = $this->getStartedQuery($request->user(), $request)->get();

        $pdf = Pdf::loadView('pdf.branches', compact('branches'));
        $filename = 'Rekapan Data Cabang Per ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
