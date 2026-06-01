<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductItemRequest;
use App\Services\ProductItemService;
use App\Services\ProductItemDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\DatatableRequest;

class ProductItemController extends Controller
{
    public function __construct(
        protected ProductItemService $service,
        protected ProductItemDatatableService $datatableService
    ) {}

    /**
     * Display the product items page.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('product-items/index');
    }

    /**
     * Show the form for creating a new product item.
     */
    public function create(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        return Inertia::render('product-items/create', [
            'businesses' => $selection['businesses'],
            'users' => $selection['users'],
            'product_units' => $selection['productUnits'],
            'products' => $selection['products']
        ]);
    }

    /**
     * Show the form for editing the specified product item.
     */
    public function edit(int $id, Request $request): Response
    {
        $user = Auth::user();
        $productItem = $this->service->getAuthorizedProductItem($id, $user);
        $selection = $this->service->getSelectionData($user);

        return Inertia::render('product-items/edit', [
            'product' => $productItem,
            'businesses' => $selection['businesses'],
            'users' => $selection['users'],
            'product_units' => $selection['productUnits'],
            'products' => $selection['products']
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
     * Store a newly created product item.
     */
    public function store(ProductItemRequest $request)
    {
        $payload = $request->validated();
        $this->service->create($payload, Auth::user());

        return redirect()->route('product_items.index')
            ->with('success', 'Item produk berhasil dibuat.');
    }

    /**
     * Update the specified product item.
     */
    public function update(ProductItemRequest $request, int $id)
    {
        $payload = $request->validated();
        $this->service->update($id, $payload, Auth::user());

        return redirect()->route('product_items.index')
            ->with('success', 'Item produk berhasil diperbarui.');
    }

    /**
     * Remove the specified product item.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id, Auth::user());

        return redirect()->route('product_items.index')
            ->with('success', 'Item produk berhasil dihapus.');
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
     * Get products by business ID.
     */
    public function ownerProducts(Request $request): JsonResponse
    {
        $businessId = $request->query('business_id');
        if (!$businessId) {
            return response()->json([]);
        }

        $products = $this->service->getProductsByBusinessId((int) $businessId);
        return response()->json($products);
    }
}
