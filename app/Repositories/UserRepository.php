<?php

namespace App\Repositories;

use Illuminate\Support\Collection;

interface UserRepository
{
    /**
     * Get users who have a specific permission (direct or role-inherited).
     */
    public function getUsersByPermission(string $permissionName): Collection;
}
