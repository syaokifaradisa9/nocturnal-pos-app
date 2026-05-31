<?php

namespace App\Http\Controllers;

use App\DTOs\BusinessDTO;
use App\Http\Requests\BusinessRequest;
use App\Services\BusinessService;
use App\Services\BusinessDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;

use App\Enums\UserPermission;

use App\Http\Requests\DatatableRequest;

class BusinessController extends Controller
{
    public function __construct(
        protected BusinessService $service,
        protected BusinessDatatableService $datatableService
    ) {}

    /**
     * Display the businesses page.
     */
    public function index(Request $request): Response
    {
        $users = [];
        $user = Auth::user();
        if ($user->hasPermission(UserPermission::VIEW_ANY_BUSINESS)) {
            $users = $this->service->getUsersWithViewOwnPermission();
        }

        return Inertia::render('businesses/index', [
            'users' => $users
        ]);
    }

    /**
     * Show the form for creating a new business.
     */
    public function create(Request $request): Response
    {
        $users = [];
        $user = Auth::user();
        if ($user->hasPermission(UserPermission::VIEW_ANY_BUSINESS)) {
            $users = $this->service->getUsersWithViewOwnPermission();
        }

        return Inertia::render('businesses/create', [
            'users' => $users
        ]);
    }

    /**
     * Show the form for editing the specified business.
     */
    public function edit(int $id, Request $request): Response
    {
        $user = Auth::user();
        $business = $this->service->getAuthorizedBusiness($id, $user);
        
        $users = [];
        if ($user->hasPermission(UserPermission::VIEW_ANY_BUSINESS)) {
            $users = $this->service->getUsersWithViewOwnPermission();
        }

        return Inertia::render('businesses/create', [
            'business' => $business,
            'users' => $users
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
     * Store a newly created business.
     */
    public function store(BusinessRequest $request)
    {
        $dto = BusinessDTO::fromRequest($request);
        $this->service->create($dto, Auth::user());

        return redirect()->route('businesses.index')
            ->with('success', 'Bisnis berhasil dibuat.');
    }

    /**
     * Update the specified business.
     */
    public function update(BusinessRequest $request, int $id)
    {
        $dto = BusinessDTO::fromRequest($request);
        $this->service->update($id, $dto, Auth::user());

        return redirect()->route('businesses.index')
            ->with('success', 'Bisnis berhasil diperbarui.');
    }

    /**
     * Remove the specified business.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id, Auth::user());

        return redirect()->route('businesses.index')
            ->with('success', 'Bisnis berhasil dihapus.');
    }
}
