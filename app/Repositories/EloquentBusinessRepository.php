<?php

namespace App\Repositories;

use App\Models\Business;
use Illuminate\Database\Eloquent\Builder;

class EloquentBusinessRepository implements BusinessRepository
{
    /**
     * Get all businesses or query builder.
     */
    public function query(): Builder
    {
        return Business::query();
    }

    /**
     * Find a business by ID.
     */
    public function find(int $id): ?Business
    {
        return Business::find($id);
    }

    /**
     * Find a business by ID or fail.
     */
    public function findOrFail(int $id): Business
    {
        return Business::findOrFail($id);
    }

    /**
     * Create a new business.
     */
    public function create(array $data): Business
    {
        return Business::create($data);
    }

    /**
     * Update an existing business.
     */
    public function update(int $id, array $data): Business
    {
        $business = $this->findOrFail($id);
        $business->update($data);
        return $business;
    }

    /**
     * Delete a business (soft delete).
     */
    public function delete(int $id): bool
    {
        $business = $this->findOrFail($id);
        return $business->delete();
    }
}
