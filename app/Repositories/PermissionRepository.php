<?php

namespace App\Repositories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Builder;

interface PermissionRepository
{
    /**
     * Get all permissions or query builder.
     */
    public function query(): Builder;

    /**
     * Find a permission by name.
     */
    public function findByName(string $name): ?Permission;
}
