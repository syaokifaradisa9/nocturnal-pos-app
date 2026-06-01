<?php

namespace App\Services;

use App\Models\PurchaseReceipt;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseReceiptDatatableService
{
    /**
     * Get started query.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = PurchaseReceipt::query()->with(['supplier', 'branch', 'branch.business']);

        // Scope by permission
        $query->when($user->hasPermission(UserPermission::VIEW_ANY_PURCHASE_RECEIPT), function (Builder $q) {
            // No filter
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PURCHASE_RECEIPT) && $user->hasPermission(UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT), function (Builder $q) use ($user) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $q->whereHas('branch', function ($sub) use ($associatedBusinessIds) {
                $sub->whereIn('business_id', $associatedBusinessIds);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PURCHASE_RECEIPT) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT) && $user->hasPermission(UserPermission::VIEW_OWN_PURCHASE_RECEIPT), function (Builder $q) use ($user) {
            $q->whereHas('branch', function ($sub) use ($user) {
                $sub->where('user_id', $user->id);
            });
        })->when(!$user->hasPermission(UserPermission::VIEW_ANY_PURCHASE_RECEIPT) && !$user->hasPermission(UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT) && !$user->hasPermission(UserPermission::VIEW_OWN_PURCHASE_RECEIPT), function (Builder $q) {
            $q->whereRaw('1 = 0');
        });

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Global search
        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('receipt_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function (Builder $sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
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
        $query->when($request->input('receipt_number'), function (Builder $q, $receiptNumber) {
            $q->where('receipt_number', 'like', "%{$receiptNumber}%");
        })->when($request->input('status'), function (Builder $q, $status) {
            $q->where('status', 'like', "%{$status}%");
        })->when($request->input('supplier'), function (Builder $q, $supplierName) {
            $q->whereHas('supplier', function (Builder $sq) use ($supplierName) {
                $sq->where('name', 'like', "%{$supplierName}%");
            });
        })->when($request->input('branch'), function (Builder $q, $branchName) {
            $q->whereHas('branch', function (Builder $bq) use ($branchName) {
                $bq->where('name', 'like', "%{$branchName}%");
            });
        });

        // Sort
        $query->orderBy($sortField, $sortOrder);

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
                'Nomor Penerimaan' => $row->receipt_number ?: '-',
                'Tanggal Penerimaan' => $row->receipt_date,
                'Supplier' => $row->supplier?->name ?: '-',
                'Cabang' => $row->branch?->name ?: '-',
                'Status' => $row->status,
                'Catatan' => $row->notes ?: '-',
            ];
            $mappedData->push($item);
        }

        $filename = 'Rekapan Penerimaan Barang ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export to PDF.
     */
    public function printPdf(DatatableRequest $request)
    {
        $receipts = $this->getStartedQuery($request->user(), $request)->get();

        $pdf = Pdf::loadView('pdf.purchase-receipts', compact('receipts'));
        $filename = 'Rekapan Penerimaan Barang ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
