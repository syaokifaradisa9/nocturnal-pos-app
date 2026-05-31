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
}
