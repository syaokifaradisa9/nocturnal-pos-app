<?php

namespace App\Http\Controllers;

use App\DTOs\ProductUnitDTO;
use App\Http\Requests\ProductUnitRequest;
use App\Services\ProductUnitService;
use App\Services\ProductUnitDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\DatatableRequest;

class ProductUnitController extends Controller
{
    public function __construct(
        protected ProductUnitService $service,
        protected ProductUnitDatatableService $datatableService
    ) {}

    /**
     * Display the product units page.
     */
    public function index(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        return Inertia::render('product-units/index', [
            'businesses' => $selection['businesses'],
            'users' => $selection['users']
        ]);
    }

    /**
     * Return datatable JSON data.
     */
    public function datatable(DatatableRequest $request): JsonResponse
    {
        return response()->json($this->datatableService->getDatatable($request));
    }

    /**
     * Get businesses by owner (user) ID.
     */
    public function ownerBusinesses(Request $request): JsonResponse
    {
        $userId = $request->query('user_id');
        if (!$userId) {
            return response()->json([]);
        }

        $businesses = $this->service->getBusinessesByUserId((int) $userId);
        return response()->json($businesses);
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
     * Store a newly created product unit.
     */
    public function store(ProductUnitRequest $request)
    {
        $dto = ProductUnitDTO::fromRequest($request);
        $this->service->create($dto, Auth::user());

        return redirect()->route('product_units.index')
            ->with('success', 'Satuan produk berhasil dibuat.');
    }

    /**
     * Update the specified product unit.
     */
    public function update(ProductUnitRequest $request, int $id)
    {
        $dto = ProductUnitDTO::fromRequest($request);
        $this->service->update($id, $dto, Auth::user());

        return redirect()->route('product_units.index')
            ->with('success', 'Satuan produk berhasil diperbarui.');
    }

    /**
     * Remove the specified product unit.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id, Auth::user());

        return redirect()->route('product_units.index')
            ->with('success', 'Satuan produk berhasil dihapus.');
    }
}
