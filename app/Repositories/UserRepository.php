<?php

namespace App\Repositories;

use Illuminate\Support\Collection;

interface UserRepository
{
    /**
     * Get users who have a specific permission (direct or role-inherited).
     */
    public function getUsersByPermission(string $permissionName): Collection;

    /**
     * Get query builder for users.
     */
    public function query(): \Illuminate\Database\Eloquent\Builder;

    /**
     * Find user by ID.
     */
    public function find(int $id): ?\App\Models\User;

    /**
     * Find user by ID or fail.
     */
    public function findOrFail(int $id): \App\Models\User;

    /**
     * Create a new user.
     */
    public function create(array $data): \App\Models\User;

    /**
     * Update an existing user.
     */
    public function update(int $id, array $data): \App\Models\User;

    /**
     * Delete a user (soft delete).
     */
    public function delete(int $id): bool;
}
