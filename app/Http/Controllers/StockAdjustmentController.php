<?php

namespace App\Http\Controllers;

use App\DTOs\StockAdjustmentDTO;
use App\Http\Requests\StockAdjustmentRequest;
use App\Http\Requests\DatatableRequest;
use App\Services\StockAdjustmentService;
use App\Services\StockAdjustmentDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;

class StockAdjustmentController extends Controller
{
    public function __construct(
        protected StockAdjustmentService $service,
        protected StockAdjustmentDatatableService $datatableService
    ) {}

    /**
     * Display stock adjustments page.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('stock-adjustments/index');
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
        $branches = $this->service->getBranchSelections(Auth::user());

        return Inertia::render('stock-adjustments/create', [
            'branches' => $branches,
        ]);
    }

    /**
     * Get inventory batches for branch by ID.
     */
    public function branchBatches(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');
        if (!$branchId) {
            return response()->json([]);
        }

        $data = $this->service->getActiveBatchesForBranch((int) $branchId);
        return response()->json($data);
    }

    /**
     * Store a newly created stock adjustment.
     */
    public function store(StockAdjustmentRequest $request)
    {
        $dto = StockAdjustmentDTO::fromRequest($request);
        $this->service->create($dto, Auth::user());

        return redirect()->route('stock-adjustments.index')
            ->with('success', 'Stock opname berhasil disimpan.');
    }

    /**
     * Export to Excel.
     */
    public function printExcel(DatatableRequest $request): SymfonyResponse
    {
        return $this->datatableService->printExcel($request);
    }

    /**
     * Export to PDF.
     */
    public function printPdf(DatatableRequest $request): SymfonyResponse
    {
        return $this->datatableService->printPdf($request);
    }

    /**
     * Remove the specified stock adjustment.
     */
    public function destroy(Request $request, int $id)
    {
        try {
            $this->service->delete($id, Auth::user());
            return redirect()->route('stock-adjustments.index')
                ->with('success', 'Stock opname berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->route('stock-adjustments.index')
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Display details of a stock adjustment as JSON.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $adjustment = $this->service->getAuthorizedAdjustment($id, Auth::user());

        $adjustment->load([
            'branch.business',
            'user',
            'items.inventoryBatch.productItemMeasurement.productItem',
            'items.inventoryBatch.productItemMeasurement.measurementUnit',
            'items.inventoryBatch.productItemMeasurement.targetMeasurementUnit',
        ]);

        return response()->json($adjustment);
    }
}
