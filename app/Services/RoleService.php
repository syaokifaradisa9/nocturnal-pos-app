<?php

namespace App\Services;

use App\DTOs\RoleDTO;
use App\Models\Role;
use App\Models\Permission;
use App\Repositories\RoleRepository;
use Illuminate\Database\Eloquent\Collection;

class RoleService
{
    public function __construct(
        protected RoleRepository $repository
    ) {}

    /**
     * Get all roles.
     */
    public function all(): Collection
    {
        return $this->repository->query()->with('permissions')->get();
    }

    /**
     * Create a role and sync permissions.
     */
    public function create(RoleDTO $dto): Role
    {
        $data = $dto->toArray();
        $role = $this->repository->create($data);

        if ($dto->permissionIds !== null) {
            $role->permissions()->sync($dto->permissionIds);
        }

        return $role;
    }

    /**
     * Update a role and sync permissions.
     */
    public function update(int $id, RoleDTO $dto): Role
    {
        $data = $dto->toArray();
        $role = $this->repository->update($id, $data);

        if ($dto->permissionIds !== null) {
            $role->permissions()->sync($dto->permissionIds);
        }

        return $role;
    }

    /**
     * Delete a role.
     */
    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }

    /**
     * Get all permissions.
     */
    public function getAllPermissions(): Collection
    {
        return Permission::all();
    }
}
