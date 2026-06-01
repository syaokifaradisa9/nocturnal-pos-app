<?php

namespace App\Repositories;

use App\Models\Role;

class EloquentRoleRepository implements RoleRepository
{
    /**
     * Find or create a role by name.
     */
    public function firstOrCreate(string $name, array $defaults = []): Role
    {
        return Role::firstOrCreate(
            ['name' => $name],
            $defaults
        );
    }

    /**
     * Find the first role that has a specific permission.
     */
    public function findByPermission(string $permissionName): ?Role
    {
        return Role::whereHas('permissions', function ($query) use ($permissionName) {
            $query->where('name', $permissionName);
        })->first();
    }

    /**
     * Get all roles or query builder.
     */
    public function query(): \Illuminate\Database\Eloquent\Builder
    {
        return Role::query();
    }

    /**
     * Find a role by ID.
     */
    public function find(int $id): ?Role
    {
        return Role::find($id);
    }

    /**
     * Find a role by ID or fail.
     */
    public function findOrFail(int $id): Role
    {
        return Role::findOrFail($id);
    }

    /**
     * Create a new role.
     */
    public function create(array $data): Role
    {
        return Role::create($data);
    }

    /**
     * Update an existing role.
     */
    public function update(int $id, array $data): Role
    {
        $role = $this->findOrFail($id);
        $role->update($data);
        return $role;
    }

    /**
     * Delete a role.
     */
    public function delete(int $id): bool
    {
        $role = $this->findOrFail($id);
        return $role->delete();
    }
}
