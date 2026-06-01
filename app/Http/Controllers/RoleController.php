<?php

namespace App\Http\Controllers;

use App\DTOs\RoleDTO;
use App\Http\Requests\RoleRequest;
use App\Services\RoleService;
use App\Services\RoleDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\DatatableRequest;

class RoleController extends Controller
{
    public function __construct(
        protected RoleService $service,
        protected RoleDatatableService $datatableService
    ) {}

    /**
     * Display the roles page.
     */
    public function index(Request $request): Response
    {
        $permissions = $this->service->getAllPermissions();

        return Inertia::render('roles/index', [
            'permissions' => $permissions
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
     * Store a newly created role.
     */
    public function store(RoleRequest $request)
    {
        $dto = RoleDTO::fromRequest($request);
        $this->service->create($dto);

        return redirect()->route('roles.index')
            ->with('success', 'Role berhasil dibuat.');
    }

    /**
     * Update the specified role.
     */
    public function update(RoleRequest $request, int $id)
    {
        $dto = RoleDTO::fromRequest($request);
        $this->service->update($id, $dto);

        return redirect()->route('roles.index')
            ->with('success', 'Role berhasil diperbarui.');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id);

        return redirect()->route('roles.index')
            ->with('success', 'Role berhasil dihapus.');
    }
}
