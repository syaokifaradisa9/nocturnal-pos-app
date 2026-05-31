<?php

namespace App\Http\Controllers;

use App\DTOs\BranchDTO;
use App\Http\Requests\BranchRequest;
use App\Services\BranchService;
use App\Services\BranchDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;
use App\Enums\UserPermission;
use App\Http\Requests\DatatableRequest;

class BranchController extends Controller
{
    public function __construct(
        protected BranchService $service,
        protected BranchDatatableService $datatableService
    ) {}

    /**
     * Display the branches page.
     */
    public function index(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        return Inertia::render('branches/index', [
            'businesses' => $selection['businesses'],
            'users' => $selection['users']
        ]);
    }

    /**
     * Show the form for creating a new branch.
     */
    public function create(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        return Inertia::render('branches/create', [
            'businesses' => $selection['businesses'],
            'users' => $selection['users']
        ]);
    }

    /**
     * Show the form for editing the specified branch.
     */
    public function edit(int $id, Request $request): Response
    {
        $user = Auth::user();
        $branch = $this->service->getAuthorizedBranch($id, $user);
        $selection = $this->service->getSelectionData($user);

        return Inertia::render('branches/index', [
            'branch' => $branch,
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
     * Store a newly created branch.
     */
    public function store(BranchRequest $request)
    {
        $dto = BranchDTO::fromRequest($request);
        $this->service->create($dto, Auth::user());

        return redirect()->route('branches.index')
            ->with('success', 'Cabang berhasil dibuat.');
    }

    /**
     * Update the specified branch.
     */
    public function update(BranchRequest $request, int $id)
    {
        $dto = BranchDTO::fromRequest($request);
        $this->service->update($id, $dto, Auth::user());

        return redirect()->route('branches.index')
            ->with('success', 'Cabang berhasil diperbarui.');
    }

    /**
     * Remove the specified branch.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id, Auth::user());

        return redirect()->route('branches.index')
            ->with('success', 'Cabang berhasil dihapus.');
    }
}
