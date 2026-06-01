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

    /**
     * Get all roles or query builder.
     */
    public function query(): \Illuminate\Database\Eloquent\Builder;

    /**
     * Find a role by ID.
     */
    public function find(int $id): ?Role;

    /**
     * Find a role by ID or fail.
     */
    public function findOrFail(int $id): Role;

    /**
     * Create a new role.
     */
    public function create(array $data): Role;

    /**
     * Update an existing role.
     */
    public function update(int $id, array $data): Role;

    /**
     * Delete a role.
     */
    public function delete(int $id): bool;
}
