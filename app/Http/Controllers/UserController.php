<?php

namespace App\Http\Controllers;

use App\DTOs\UserDTO;
use App\Http\Requests\UserRequest;
use App\Services\UserService;
use App\Services\UserDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use App\Http\Requests\DatatableRequest;

class UserController extends Controller
{
    public function __construct(
        protected UserService $service,
        protected UserDatatableService $datatableService
    ) {}

    /**
     * Display the users page.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('users/index');
    }

    /**
     * Return datatable JSON data.
     */
    public function datatable(DatatableRequest $request): JsonResponse
    {
        return response()->json($this->datatableService->getDatatable($request));
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
     * Store a newly created user and their business.
     */
    public function store(UserRequest $request)
    {
        $dto = UserDTO::fromRequest($request);
        $this->service->create($dto);

        return redirect()->route('users.index')
            ->with('success', 'User dan Bisnis berhasil dibuat.');
    }

    /**
     * Update the specified user and their business details.
     */
    public function update(UserRequest $request, int $id)
    {
        $dto = UserDTO::fromRequest($request);
        $this->service->update($id, $dto);

        return redirect()->route('users.index')
            ->with('success', 'User dan Bisnis berhasil diperbarui.');
    }

    /**
     * Remove the specified user and their business.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id);

        return redirect()->route('users.index')
            ->with('success', 'User dan Bisnis berhasil dihapus.');
    }
}
