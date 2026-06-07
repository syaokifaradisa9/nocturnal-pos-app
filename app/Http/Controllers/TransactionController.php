<?php

namespace App\Http\Controllers;

use App\Http\Requests\TransactionRequest;
use App\DTOs\TransactionDTO;
use App\Services\TransactionService;
use App\Enums\UserPermission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\DatatableRequest;
use App\Services\TransactionDatatableService;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class TransactionController extends Controller
{
    public function __construct(
        protected TransactionService $service
    ) {}

    /**
     * Render POS Cashier dashboard.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Retrieve authorized branches
        if ($user->hasPermission(UserPermission::VIEW_ANY_BRANCH->value) || $user->hasPermission(UserPermission::VIEW_ANY_BUSINESS->value)) {
            $branches = \App\Models\Branch::with('business')->get();
        } else {
            $branches = $user->branches()->with('business')->get();
        }

        $mappedBranches = $branches->map(function($b) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'business_name' => $b->business ? $b->business->name : '',
                'label' => $b->business ? "{$b->business->name} {$b->name}" : $b->name
            ];
        })->values()->toArray();

        return Inertia::render('cashier/index', [
            'branches' => $mappedBranches
        ]);
    }

    /**
     * REST API to fetch products.
     */
    public function products(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');
        $productId = $request->query('product_id');

        if (!$branchId) {
            return response()->json(['error' => 'Cabang wajib ditentukan.'], 400);
        }

        $products = $this->service->getProductsForBranch((int) $branchId, $productId ? (int) $productId : null);
        $filters = $this->service->getFiltersForBranch((int) $branchId);

        return response()->json([
            'products' => $products,
            'filters' => $filters
        ]);
    }

    /**
     * REST API to fetch customers.
     */
    public function customers(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');

        if (!$branchId) {
            return response()->json(['error' => 'Cabang wajib ditentukan.'], 400);
        }

        $customers = $this->service->getCustomersForBranch((int) $branchId);

        return response()->json([
            'customers' => $customers
        ]);
    }

    /**
     * REST API to fetch drafts.
     */
    public function drafts(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');

        if (!$branchId) {
            return response()->json(['error' => 'Cabang wajib ditentukan.'], 400);
        }

        $drafts = $this->service->getDraftsForBranch((int) $branchId);

        return response()->json([
            'drafts' => $drafts
        ]);
    }

    /**
     * REST API to checkout / save draft transaction.
     */
    public function checkout(TransactionRequest $request): JsonResponse
    {
        $dto = TransactionDTO::fromRequest($request);
        $transaction = $this->service->processTransaction($dto);

        return response()->json([
            'success' => true,
            'message' => $dto->status === 'draft' ? 'Transaksi tersimpan sebagai draft' : 'Transaksi checkout berhasil diselesaikan.',
            'transaction_id' => $transaction->id
        ]);
    }

    /**
     * REST API to delete a draft transaction.
     */
    public function deleteDraft($id): JsonResponse
    {
        $this->service->deleteDraft((int) $id);
        return response()->json([
            'success' => true,
            'message' => 'Draft berhasil dihapus.'
        ]);
    }

    /**
     * Display the sales transactions history page.
     */
    public function list(Request $request): Response
    {
        $user = Auth::user();

        if ($user->hasPermission(UserPermission::VIEW_ANY_BRANCH->value) || $user->hasPermission(UserPermission::VIEW_ANY_BUSINESS->value)) {
            $branches = \App\Models\Branch::with('business')->get();
        } else {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $branches = \App\Models\Branch::whereIn('business_id', $associatedBusinessIds)
                ->orWhereHas('business', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->orWhereIn('id', $user->branches()->pluck('branches.id')->toArray())
                ->with('business')
                ->get();
        }

        $mappedBranches = $branches->map(function($b) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'business_name' => $b->business ? $b->business->name : '',
                'label' => $b->business ? "{$b->business->name} {$b->name}" : $b->name
            ];
        })->values()->toArray();

        return Inertia::render('transactions/index', [
            'branches' => $mappedBranches
        ]);
    }

    /**
     * Return datatable JSON data for transactions.
     */
    public function datatable(DatatableRequest $request, TransactionDatatableService $datatableService): JsonResponse
    {
        return response()->json($datatableService->getDatatable($request));
    }

    /**
     * Export to Excel.
     */
    public function printExcel(DatatableRequest $request, TransactionDatatableService $datatableService): SymfonyResponse
    {
        return $datatableService->printExcel($request);
    }

    /**
     * Export/Print to PDF.
     */
    public function printPdf(DatatableRequest $request, TransactionDatatableService $datatableService): SymfonyResponse
    {
        return $datatableService->printPdf($request);
    }

    /**
     * Fetch a single transaction details.
     */
    public function show(int $id): JsonResponse
    {
        $transaction = \App\Models\Transaction::with(['customer', 'branch.business', 'items'])->findOrFail($id);

        $subtotal = 0;
        foreach ($transaction->items as $item) {
            $subtotal += ($item->quantity * $item->price);
        }
        $total = $subtotal - (float) $transaction->discount_price;

        return response()->json([
            'id' => $transaction->id,
            'customer_name' => $transaction->customer ? $transaction->customer->name : 'Walk-in Customer',
            'branch_name' => $transaction->branch ? $transaction->branch->name : null,
            'business_name' => ($transaction->branch && $transaction->branch->business) ? $transaction->branch->business->name : null,
            'discount_price' => (float) $transaction->discount_price,
            'status' => $transaction->status,
            'payment_method' => $transaction->payment_method ?: '-',
            'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
            'subtotal' => $subtotal,
            'total' => $total,
            'items' => $transaction->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'measurement_name' => $item->measurement_name,
                    'quantity' => (float) $item->quantity,
                    'price' => (float) $item->price,
                    'total' => $item->quantity * $item->price,
                ];
            }),
        ]);
    }
}
