<?php

namespace App\Repositories;

use App\Models\Role;

interface RoleRepository
{
    /**
     * Find or create a role by name.
     */
    public function firstOrCreate(string $name, array $defaults = []): Role;

    /**
     * Find the first role that has a specific permission.
     */
    public function findByPermission(string $permissionName): ?Role;
}
