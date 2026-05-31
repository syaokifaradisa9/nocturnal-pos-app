<?php

namespace App\Http\Controllers;

use App\DTOs\ProductDTO;
use App\Http\Requests\ProductRequest;
use App\Services\ProductService;
use App\Services\ProductDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\DatatableRequest;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $service,
        protected ProductDatatableService $datatableService
    ) {}

    /**
     * Display the products page.
     */
    public function index(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        return Inertia::render('products/index', [
            'businesses' => $selection['businesses'],
            'users' => $selection['users']
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        return Inertia::render('products/create', [
            'businesses' => $selection['businesses'],
            'users' => $selection['users']
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(int $id, Request $request): Response
    {
        $user = Auth::user();
        $product = $this->service->getAuthorizedProduct($id, $user);
        $selection = $this->service->getSelectionData($user);

        return Inertia::render('products/index', [
            'product' => $product,
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
     * Store a newly created product.
     */
    public function store(ProductRequest $request)
    {
        $dto = ProductDTO::fromRequest($request);
        $this->service->create($dto, Auth::user());

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil dibuat.');
    }

    /**
     * Update the specified product.
     */
    public function update(ProductRequest $request, int $id)
    {
        $dto = ProductDTO::fromRequest($request);
        $this->service->update($id, $dto, Auth::user());

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil diperbarui.');
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id, Auth::user());

        return redirect()->route('products.index')
            ->with('success', 'Produk berhasil dihapus.');
    }
}
