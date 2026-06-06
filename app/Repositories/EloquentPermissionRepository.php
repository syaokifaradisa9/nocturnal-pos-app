<?php

namespace App\Repositories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Builder;

class EloquentPermissionRepository implements PermissionRepository
{
    /**
     * Get all permissions or query builder.
     */
    public function query(): Builder
    {
        return Permission::query();
    }

    /**
     * Find a permission by name.
     */
    public function findByName(string $name): ?Permission
    {
        return Permission::where('name', $name)->first();
    }
}
