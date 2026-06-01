<?php

namespace App\Http\Controllers;

use App\DTOs\SupplierDTO;
use App\Http\Requests\SupplierRequest;
use App\Services\SupplierService;
use App\Services\SupplierDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\DatatableRequest;

class SupplierController extends Controller
{
    public function __construct(
        protected SupplierService $service,
        protected SupplierDatatableService $datatableService
    ) {}

    /**
     * Display the suppliers page.
     */
    public function index(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        return Inertia::render('suppliers/index', [
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
     * Store a newly created supplier.
     */
    public function store(SupplierRequest $request)
    {
        $dto = SupplierDTO::fromRequest($request);
        $this->service->create($dto, Auth::user());

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier berhasil dibuat.');
    }

    /**
     * Update the specified supplier.
     */
    public function update(SupplierRequest $request, int $id)
    {
        $dto = SupplierDTO::fromRequest($request);
        $this->service->update($id, $dto, Auth::user());

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier berhasil diperbarui.');
    }

    /**
     * Remove the specified supplier.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id, Auth::user());

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier berhasil dihapus.');
    }
}
