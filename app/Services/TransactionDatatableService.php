<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;
use Rap2hpoutre\FastExcel\FastExcel;
use Barryvdh\DomPDF\Facade\Pdf;

class TransactionDatatableService
{
    /**
     * Get the starting query with pre-loaded relations, search, and sorting filters.
     */
    private function getStartedQuery(User $user, DatatableRequest $request): Builder
    {
        $query = Transaction::where('status', 'completed')->with(['customer', 'branch.business', 'items']);

        // Scope by permission
        if ($user->hasPermission(UserPermission::VIEW_ANY_TRANSACTION)) {
            // No filter
        } elseif ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_TRANSACTION)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $query->whereHas('branch', function ($q) use ($associatedBusinessIds) {
                $q->whereIn('business_id', $associatedBusinessIds);
            });
        } elseif ($user->hasPermission(UserPermission::VIEW_OWN_TRANSACTION)) {
            $query->whereHas('branch.business', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } else {
            $query->whereRaw('1 = 0');
        }

        // Apply filters
        $search = $request->input('search');
        $branchId = $request->input('branch_id');
        $paymentMethod = $request->input('payment_method');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('id', 'like', "%{$search}%")
                    ->orWhere('payment_method', 'like', "%{$search}%")
                    ->orWhereHas('customer', function (Builder $custQ) use ($search) {
                        $custQ->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('branch', function (Builder $branchQ) use ($search) {
                        $branchQ->where('name', 'like', "%{$search}%");
                    });
            });
        });

        $query->when($branchId, function (Builder $q, $branchId) {
            $q->where('branch_id', $branchId);
        });

        $query->when($paymentMethod, function (Builder $q, $paymentMethod) {
            $q->where('payment_method', $paymentMethod);
        });

        $query->when($startDate, function (Builder $q, $startDate) {
            $q->whereDate('created_at', '>=', $startDate);
        });

        $query->when($endDate, function (Builder $q, $endDate) {
            $q->whereDate('created_at', '<=', $endDate);
        });

        // Apply individual column searches from Datatable footer inputs
        $query->when($request->input('id'), function (Builder $q, $id) {
            $q->where('id', 'like', "%{$id}%");
        })->when($request->input('created_at'), function (Builder $q, $createdAt) {
            $q->where('created_at', 'like', "%{$createdAt}%");
        })->when($request->input('branch_name'), function (Builder $q, $branchName) {
            $q->whereHas('branch', function ($sub) use ($branchName) {
                $sub->where('name', 'like', "%{$branchName}%")
                    ->orWhereHas('business', function ($sub2) use ($branchName) {
                        $sub2->where('name', 'like', "%{$branchName}%");
                    });
            });
        })->when($request->input('customer_name'), function (Builder $q, $customerName) {
            $q->whereHas('customer', function ($sub) use ($customerName) {
                $sub->where('name', 'like', "%{$customerName}%");
            });
        })->when($request->input('payment_method') && !$paymentMethod, function (Builder $q, $payMethod) {
            $q->where('payment_method', 'like', "%{$payMethod}%");
        });

        // Apply sorting
        $sortField = $request->input('sort_by') ?? 'id';
        $sortOrder = $request->input('sort_type') ?? 'desc';
        
        if ($sortField === 'branch_name') {
            $query->select('transactions.*')
                ->join('branches', 'transactions.branch_id', '=', 'branches.id')
                ->orderBy('branches.name', $sortOrder);
        } elseif ($sortField === 'customer_name') {
            $query->select('transactions.*')
                ->leftJoin('customers', 'transactions.customer_id', '=', 'customers.id')
                ->orderBy('customers.name', $sortOrder);
        } elseif ($sortField === 'total') {
            $query->select('transactions.*')
                ->leftJoin('transaction_item', 'transactions.id', '=', 'transaction_item.transaction_id')
                ->selectRaw('COALESCE(SUM(transaction_item.quantity * transaction_item.price), 0) - transactions.discount_price as total_pay')
                ->groupBy('transactions.id', 'transactions.customer_id', 'transactions.branch_id', 'transactions.discount_price', 'transactions.status', 'transactions.payment_method', 'transactions.created_at', 'transactions.updated_at', 'transactions.deleted_at')
                ->orderBy('total_pay', $sortOrder);
        } else {
            $query->orderBy('transactions.' . $sortField, $sortOrder);
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
            $subtotal = 0;
            foreach ($row->items as $item) {
                $subtotal += ($item->quantity * $item->price);
            }
            $total = $subtotal - (float) $row->discount_price;

            return [
                'id' => $row->id,
                'customer_name' => $row->customer ? $row->customer->name : 'Walk-in Customer',
                'branch_name' => $row->branch ? $row->branch->name : null,
                'business_name' => ($row->branch && $row->branch->business) ? $row->branch->business->name : null,
                'discount_price' => (float) $row->discount_price,
                'status' => $row->status,
                'payment_method' => $row->payment_method ?: '-',
                'created_at' => $row->created_at ? $row->created_at->translatedFormat('d F Y H:i') : '-',
                'subtotal' => $subtotal,
                'total' => $total,
                'items' => $row->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_name' => $item->product_name,
                        'measurement_name' => $item->measurement_name,
                        'quantity' => (float) $item->quantity,
                        'price' => (float) $item->price,
                        'total' => $item->quantity * $item->price,
                    ];
                }),
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
            $subtotal = 0;
            foreach ($row->items as $item) {
                $subtotal += ($item->quantity * $item->price);
            }
            $total = $subtotal - (float) $row->discount_price;

            $item = [
                'No' => $index + 1,
                'No Invoice' => '#' . $row->id,
                'Tanggal' => $row->created_at ? $row->created_at->format('Y-m-d H:i:s') : '-',
                'Cabang' => $row->branch ? $row->branch->name : '-',
                'Customer' => $row->customer ? $row->customer->name : 'Walk-in Customer',
                'Metode Pembayaran' => $row->payment_method ?: '-',
                'Status' => $row->status,
                'Subtotal' => $subtotal,
                'Diskon' => (float) $row->discount_price,
                'Total Bayar' => $total,
            ];

            $mappedData->push($item);
        }

        $filename = 'Rekapan Transaksi Penjualan Per ' . date('d F Y') . '.xlsx';
        return (new FastExcel($mappedData))->download($filename);
    }

    /**
     * Export the query data to PDF format.
     */
    public function printPdf(DatatableRequest $request)
    {
        $transactions = $this->getStartedQuery($request->user(), $request)->get();

        // Calculate totals for rendering in view
        foreach ($transactions as $row) {
            $subtotal = 0;
            foreach ($row->items as $item) {
                $subtotal += ($item->quantity * $item->price);
            }
            $row->subtotal = $subtotal;
            $row->total = $subtotal - (float) $row->discount_price;
        }

        $pdf = Pdf::loadView('pdf.transactions', compact('transactions'));
        $filename = 'Rekapan Transaksi Penjualan Per ' . date('d F Y') . '.pdf';
        return $pdf->stream($filename);
    }
}
