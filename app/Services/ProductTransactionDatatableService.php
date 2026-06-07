<?php

namespace App\Services;

use App\Models\TransactionItem;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class ProductTransactionDatatableService
{
    /**
     * Get the starting query with pre-loaded relations, search, and sorting filters.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = TransactionItem::whereHas('transaction', function ($q) {
            $q->where('status', 'completed');
        })->with(['transaction.branch.business', 'transaction.customer']);

        // Scope by permission
        if ($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_TRANSACTION)) {
            // No filter
        } elseif ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_TRANSACTION)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $query->whereHas('transaction.branch', function ($q) use ($associatedBusinessIds) {
                $q->whereIn('business_id', $associatedBusinessIds);
            });
        } elseif ($user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_TRANSACTION)) {
            $query->whereHas('transaction.branch.business', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } else {
            $query->whereRaw('1 = 0');
        }

        // Apply individual column searches from Datatable footer inputs
        $query->when($request->input('transaction_id'), function (Builder $q, $txId) {
            $q->where('transaction_id', 'like', "%{$txId}%");
        })->when($request->input('created_at'), function (Builder $q, $createdAt) {
            $q->whereHas('transaction', function ($sub) use ($createdAt) {
                $sub->where('created_at', 'like', "%{$createdAt}%");
            });
        })->when($request->input('branch_name'), function (Builder $q, $branchName) {
            $q->whereHas('transaction.branch', function ($sub) use ($branchName) {
                $sub->where('name', 'like', "%{$branchName}%");
            });
        })->when($request->input('business_name'), function (Builder $q, $businessName) {
            $q->whereHas('transaction.branch.business', function ($sub) use ($businessName) {
                $sub->where('name', 'like', "%{$businessName}%");
            });
        })->when($request->input('product_name'), function (Builder $q, $productName) {
            $q->where('product_name', 'like', "%{$productName}%");
        })->when($request->input('measurement_name'), function (Builder $q, $measName) {
            $q->where('measurement_name', 'like', "%{$measName}%");
        });

        // Apply sorting
        $sortField = $request->input('sort_by') ?? 'id';
        $sortOrder = $request->input('sort_type') ?? 'desc';
        
        if ($sortField === 'transaction_id') {
            $query->orderBy('transaction_id', $sortOrder);
        } elseif ($sortField === 'created_at') {
            $query->select('transaction_item.*')
                ->join('transactions', 'transaction_item.transaction_id', '=', 'transactions.id')
                ->orderBy('transactions.created_at', $sortOrder);
        } elseif ($sortField === 'branch_name') {
            $query->select('transaction_item.*')
                ->join('transactions', 'transaction_item.transaction_id', '=', 'transactions.id')
                ->join('branches', 'transactions.branch_id', '=', 'branches.id')
                ->orderBy('branches.name', $sortOrder);
        } elseif ($sortField === 'business_name') {
            $query->select('transaction_item.*')
                ->join('transactions', 'transaction_item.transaction_id', '=', 'transactions.id')
                ->join('branches', 'transactions.branch_id', '=', 'branches.id')
                ->join('businesses', 'branches.business_id', '=', 'businesses.id')
                ->orderBy('businesses.name', $sortOrder);
        } elseif ($sortField === 'subtotal') {
            $query->select('transaction_item.*')
                ->selectRaw('(transaction_item.quantity * transaction_item.price) as line_subtotal')
                ->orderBy('line_subtotal', $sortOrder);
        } else {
            $query->orderBy('transaction_item.' . $sortField, $sortOrder);
        }

        return $query;
    }

    /**
     * Handle the datatable query and return paginated, searched results.
     */
    public function getDatatable(DatatableRequest $request)
    {
        $perPage = $request->input('limit') ?? 10;
        $paginator = $this->getStartedQuery($request->user(), $request)->paginate($perPage);

        return $paginator->through(function ($row) {
            return [
                'id' => $row->id,
                'transaction_id' => $row->transaction_id,
                'created_at' => $row->transaction && $row->transaction->created_at ? $row->transaction->created_at->translatedFormat('d F Y H:i') : '-',
                'branch_name' => ($row->transaction && $row->transaction->branch) ? $row->transaction->branch->name : null,
                'business_name' => ($row->transaction && $row->transaction->branch && $row->transaction->branch->business) ? $row->transaction->branch->business->name : null,
                'product_name' => $row->product_name,
                'measurement_name' => $row->measurement_name,
                'quantity' => (float) $row->quantity,
                'price' => (float) $row->price,
                'subtotal' => $row->quantity * $row->price,
            ];
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
                'No Invoice' => '#' . $row->transaction_id,
                'Tanggal' => $row->transaction && $row->transaction->created_at ? $row->transaction->created_at->format('Y-m-d H:i:s') : '-',
                'Bisnis' => ($row->transaction && $row->transaction->branch && $row->transaction->branch->business) ? $row->transaction->branch->business->name : '-',
                'Cabang' => ($row->transaction && $row->transaction->branch) ? $row->transaction->branch->name : '-',
                'Produk' => $row->product_name,
                'Satuan' => $row->measurement_name,
                'Quantity' => (float) $row->quantity,
                'Sub Total' => $row->quantity * $row->price,
            ];

            $mappedData->push($item);
        }

        $filename = 'Rekapan Transaksi Produk Per ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export the query data to PDF format.
     */
    public function printPdf(DatatableRequest $request)
    {
        $items = $this->getStartedQuery($request->user(), $request)->get();

        $pdf = Pdf::loadView('pdf.product_transactions', compact('items'));
        $filename = 'Rekapan Transaksi Produk Per ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
