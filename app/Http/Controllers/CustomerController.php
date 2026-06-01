<?php

namespace App\Http\Controllers;

use App\DTOs\CustomerDTO;
use App\Http\Requests\CustomerRequest;
use App\Services\CustomerService;
use App\Services\CustomerDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\DatatableRequest;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerService $service,
        protected CustomerDatatableService $datatableService
    ) {}

    /**
     * Display the customers page.
     */
    public function index(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        return Inertia::render('customers/index', [
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
     * Store a newly created customer.
     */
    public function store(CustomerRequest $request)
    {
        $dto = CustomerDTO::fromRequest($request);
        $this->service->create($dto, Auth::user());

        return redirect()->route('customers.index')
            ->with('success', 'Customer berhasil dibuat.');
    }

    /**
     * Update the specified customer.
     */
    public function update(CustomerRequest $request, int $id)
    {
        $dto = CustomerDTO::fromRequest($request);
        $this->service->update($id, $dto, Auth::user());

        return redirect()->route('customers.index')
            ->with('success', 'Customer berhasil diperbarui.');
    }

    /**
     * Remove the specified customer.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id, Auth::user());

        return redirect()->route('customers.index')
            ->with('success', 'Customer berhasil dihapus.');
    }
}
