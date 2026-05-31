<?php

namespace App\Repositories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;

class EloquentBranchRepository implements BranchRepository
{
    /**
     * Get all branches or query builder.
     */
    public function query(): Builder
    {
        return Branch::query();
    }

    /**
     * Find a branch by ID.
     */
    public function find(int $id): ?Branch
    {
        return Branch::find($id);
    }

    /**
     * Find a branch by ID or fail.
     */
    public function findOrFail(int $id): Branch
    {
        return Branch::findOrFail($id);
    }

    /**
     * Create a new branch.
     */
    public function create(array $data): Branch
    {
        return Branch::create($data);
    }

    /**
     * Update an existing branch.
     */
    public function update(int $id, array $data): Branch
    {
        $branch = $this->findOrFail($id);
        $branch->update($data);
        return $branch;
    }

    /**
     * Delete a branch (soft delete).
     */
    public function delete(int $id): bool
    {
        $branch = $this->findOrFail($id);
        return $branch->delete();
    }
}
