<?php

namespace App\Services;

use App\Models\StockAdjustment;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class StockAdjustmentDatatableService
{
    /**
     * Get started query.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = StockAdjustment::query()->with(['user', 'branch', 'branch.business']);

        // Scope by permission
        $query->when($user->hasPermission(UserPermission::VIEW_ANY_STOCK_ADJUSTMENT), function (Builder $q) {
            // No filter
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_STOCK_ADJUSTMENT) && $user->hasPermission(UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT), function (Builder $q) use ($user) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $q->whereHas('branch', function ($sub) use ($associatedBusinessIds) {
                $sub->whereIn('business_id', $associatedBusinessIds);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_STOCK_ADJUSTMENT) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT) && $user->hasPermission(UserPermission::VIEW_OWN_STOCK_ADJUSTMENT), function (Builder $q) use ($user) {
            $q->whereHas('branch', function ($sub) use ($user) {
                $sub->where('user_id', $user->id);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_STOCK_ADJUSTMENT) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT) && !$user->hasPermission(UserPermission::VIEW_OWN_STOCK_ADJUSTMENT), function (Builder $q) {
            $q->whereRaw('1 = 0');
        });

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Global search
        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('adjustment_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('user', function (Builder $uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('branch', function (Builder $bq) use ($search) {
                        $bq->where('name', 'like', "%{$search}%")
                            ->orWhereHas('business', function (Builder $busQ) use ($search) {
                                $busQ->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        });

        // Column search
        $query->when($request->input('adjustment_number'), function (Builder $q, $adjustmentNumber) {
            $q->where('adjustment_number', 'like', "%{$adjustmentNumber}%");
        })->when($request->input('status'), function (Builder $q, $status) {
            $q->where('status', 'like', "%{$status}%");
        })->when($request->input('branch'), function (Builder $q, $branchName) {
            $q->whereHas('branch', function (Builder $bq) use ($branchName) {
                $bq->where('name', 'like', "%{$branchName}%");
            });
        });

        // Sort
        $query->when($sortField, function (Builder $q) use ($sortField, $sortOrder) {
            if ($sortField === 'branch') {
                $q->join('branches', 'stock_adjustments.branch_id', '=', 'branches.id')
                  ->orderBy('branches.name', $sortOrder)
                  ->select('stock_adjustments.*');
            } else if ($sortField === 'user') {
                $q->join('users', 'stock_adjustments.user_id', '=', 'users.id')
                  ->orderBy('users.name', $sortOrder)
                  ->select('stock_adjustments.*');
            } else {
                $q->orderBy($sortField, $sortOrder);
            }
        });

        return $query;
    }

    /**
     * Get paginated datatable.
     */
    public function getDatatable(DatatableRequest $request)
    {
        $perPage = $request->validated('limit') ?? 10;
        return $this->getStartedQuery($request->user(), $request)->paginate($perPage);
    }

    /**
     * Export to Excel.
     */
    public function printExcel(DatatableRequest $request)
    {
        $data = $this->getStartedQuery($request->user(), $request)->get();
        
        $mappedData = collect();
        foreach ($data as $index => $row) {
            $item = [
                'No' => $index + 1,
                'Nomor Penyesuaian' => $row->adjustment_number,
                'Tanggal Stock Opname' => $row->adjustment_date ? $row->adjustment_date->format('Y-m-d') : '—',
                'Cabang' => $row->branch ? "{$row->branch->name} ({$row->branch->business?->name})" : '—',
                'Operator' => $row->user?->name ?? '—',
                'Status' => $row->status->value,
                'Catatan' => $row->notes ?? '—',
            ];
            $mappedData->push($item);
        }

        return (new FastExcel($mappedData))->download('data-stock-opname.xlsx');
    }

    /**
     * Export to PDF.
     */
    public function printPdf(DatatableRequest $request)
    {
        $adjustments = $this->getStartedQuery($request->user(), $request)->get();
        $pdf = Pdf::loadView('pdf.stock-adjustments', compact('adjustments'));
        return $pdf->download('data-stock-opname.pdf');
    }
}
