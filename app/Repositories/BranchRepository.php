<?php

namespace App\Repositories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;

interface BranchRepository
{
    /**
     * Get all branches or query builder.
     */
    public function query(): Builder;

    /**
     * Find a branch by ID.
     */
    public function find(int $id): ?Branch;

    /**
     * Find a branch by ID or fail.
     */
    public function findOrFail(int $id): Branch;

    /**
     * Create a new branch.
     */
    public function create(array $data): Branch;

    /**
     * Update an existing branch.
     */
    public function update(int $id, array $data): Branch;

    /**
     * Delete a branch (soft delete).
     */
    public function delete(int $id): bool;
}
