<?php

namespace App\Http\Controllers;

use App\DTOs\PurchaseReceiptDTO;
use App\Http\Requests\PurchaseReceiptRequest;
use App\Http\Requests\DatatableRequest;
use App\Services\PurchaseReceiptService;
use App\Services\PurchaseReceiptDatatableService;
use App\Models\ProductItemMeasurement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;

class PurchaseReceiptController extends Controller
{
    public function __construct(
        protected PurchaseReceiptService $service,
        protected PurchaseReceiptDatatableService $datatableService
    ) {}

    /**
     * Display the purchase receipts page.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('purchase-receipts/index');
    }

    /**
     * Return datatable JSON data.
     */
    public function datatable(DatatableRequest $request): JsonResponse
    {
        return response()->json($this->datatableService->getDatatable($request));
    }

    /**
     * Show creation page.
     */
    public function create(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        $productItemMeasurements = ProductItemMeasurement::with([
            'productItem',
            'measurementUnit',
            'targetMeasurementUnit'
        ])->get()->filter(function ($m) {
            return $m->productItem !== null && $m->measurementUnit !== null;
        })->map(function ($m) {
            $label = $m->productItem->name . ' - ' . $m->measurementUnit->name;
            if ($m->targetMeasurementUnit) {
                $label .= ' (' . rtrim(rtrim(number_format($m->conversion_rate, 4), '0'), '.') . ' ' . $m->targetMeasurementUnit->name . ')';
            }
            return [
                'id' => $m->id,
                'label' => $label,
                'product_item_id' => $m->product_item_id,
            ];
        })->values();

        return Inertia::render('purchase-receipts/create', [
            'suppliers' => $selection['suppliers'],
            'branches' => $selection['branches'],
            'users' => $selection['users'] ?? [],
            'productItemMeasurements' => $productItemMeasurements,
        ]);
    }

    /**
     * Get suppliers and branches by owner ID.
     */
    public function ownerData(Request $request): JsonResponse
    {
        $userId = $request->query('user_id');
        if (!$userId) {
            return response()->json(['suppliers' => [], 'branches' => []]);
        }

        $data = $this->service->getOwnerSelectionData((int) $userId);
        return response()->json($data);
    }

    /**
     * Store a newly created purchase receipt.
     */
    public function store(PurchaseReceiptRequest $request)
    {
        $dto = PurchaseReceiptDTO::fromRequest($request);
        $this->service->create($dto, Auth::user());

        return redirect()->route('purchase-receipts.index')
            ->with('success', 'Penerimaan barang berhasil dibuat.');
    }

    /**
     * Export to Excel CSV.
     */
    public function printExcel(DatatableRequest $request): SymfonyResponse
    {
        return $this->datatableService->printExcel($request);
    }

    /**
     * Export/Print to PDF.
     */
    public function printPdf(DatatableRequest $request): SymfonyResponse
    {
        return $this->datatableService->printPdf($request);
    }

    /**
     * Remove the specified purchase receipt.
     */
    public function destroy(Request $request, int $id)
    {
        try {
            $this->service->delete($id, Auth::user());
            return redirect()->route('purchase-receipts.index')
                ->with('success', 'Penerimaan barang berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->route('purchase-receipts.index')
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Show edit page (only for Draft status).
     */
    public function edit(Request $request, int $id): Response
    {
        $receipt = $this->service->getAuthorizedReceipt($id, Auth::user());

        if ($receipt->status !== 'Draft') {
            abort(403, 'Hanya penerimaan barang berstatus Draft yang dapat diedit.');
        }

        $receipt->load([
            'branch.business',
            'items.productItemMeasurement.productItem',
            'items.productItemMeasurement.measurementUnit',
            'items.productItemMeasurement.targetMeasurementUnit',
            'rejects.productItemMeasurement.productItem',
            'rejects.productItemMeasurement.measurementUnit',
            'rejects.productItemMeasurement.targetMeasurementUnit'
        ]);

        $selection = $this->service->getSelectionData(Auth::user());
        $ownerId = $receipt->branch?->business?->user_id;

        $suppliers = $selection['suppliers'];
        $branches = $selection['branches'];

        if (Auth::user()->hasPermission(\App\Enums\UserPermission::VIEW_ANY_PURCHASE_RECEIPT) && $ownerId) {
            $ownerSelection = $this->service->getOwnerSelectionData($ownerId);
            $suppliers = $ownerSelection['suppliers'];
            $branches = $ownerSelection['branches'];
        }

        $productItemMeasurements = ProductItemMeasurement::with([
            'productItem',
            'measurementUnit',
            'targetMeasurementUnit'
        ])->get()->filter(function ($m) {
            return $m->productItem !== null && $m->measurementUnit !== null;
        })->map(function ($m) {
            $label = $m->productItem->name . ' - ' . $m->measurementUnit->name;
            if ($m->targetMeasurementUnit) {
                $label .= ' (' . rtrim(rtrim(number_format($m->conversion_rate, 4), '0'), '.') . ' ' . $m->targetMeasurementUnit->name . ')';
            }
            return [
                'id' => $m->id,
                'label' => $label,
                'product_item_id' => $m->product_item_id,
            ];
        })->values();

        return Inertia::render('purchase-receipts/edit', [
            'receipt' => $receipt,
            'suppliers' => $suppliers,
            'branches' => $branches,
            'users' => $selection['users'] ?? [],
            'productItemMeasurements' => $productItemMeasurements,
        ]);
    }

    /**
     * Update the specified purchase receipt (only Draft).
     */
    public function update(PurchaseReceiptRequest $request, int $id)
    {
        $receipt = $this->service->getAuthorizedReceipt($id, Auth::user());

        if ($receipt->status !== 'Draft') {
            abort(403, 'Hanya penerimaan barang berstatus Draft yang dapat diedit.');
        }

        $dto = PurchaseReceiptDTO::fromRequest($request);
        $this->service->update($id, $dto, Auth::user());

        return redirect()->route('purchase-receipts.index')
            ->with('success', 'Penerimaan barang berhasil diperbarui.');
    }

    /**
     * Display the specified purchase receipt as JSON.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $receipt = $this->service->getAuthorizedReceipt($id, Auth::user());

        $receipt->load([
            'supplier',
            'branch.business',
            'branch.business.owner',
            'items.productItemMeasurement.productItem',
            'items.productItemMeasurement.measurementUnit',
            'items.productItemMeasurement.targetMeasurementUnit',
            'rejects.productItemMeasurement.productItem',
            'rejects.productItemMeasurement.measurementUnit',
            'rejects.productItemMeasurement.targetMeasurementUnit'
        ]);

        return response()->json($receipt);
    }

    /**
     * Display the confirmation page.
     */
    public function confirmPage(Request $request, int $id)
    {
        $receipt = $this->service->getAuthorizedReceipt($id, Auth::user());

        if ($receipt->status === 'Confirmed') {
            return redirect()->route('purchase-receipts.index')
                ->with('error', 'Penerimaan barang ini sudah dikonfirmasi.');
        }

        $receipt->load([
            'supplier',
            'branch.business',
            'branch.business.owner',
            'items.productItemMeasurement.productItem',
            'items.productItemMeasurement.measurementUnit',
            'items.productItemMeasurement.targetMeasurementUnit',
            'rejects.productItemMeasurement.productItem',
            'rejects.productItemMeasurement.measurementUnit',
            'rejects.productItemMeasurement.targetMeasurementUnit'
        ]);

        return Inertia::render('purchase-receipts/confirm', [
            'receipt' => $receipt,
        ]);
    }

    /**
     * Confirm the specified purchase receipt.
     */
    public function confirm(Request $request, int $id)
    {
        try {
            $this->service->confirm($id, Auth::user());
            return redirect()->route('purchase-receipts.index')
                ->with('success', 'Penerimaan barang berhasil dikonfirmasi dan disalin ke inventory batch.');
        } catch (\Exception $e) {
            return redirect()->route('purchase-receipts.index')
                ->with('error', $e->getMessage());
        }
    }
}
