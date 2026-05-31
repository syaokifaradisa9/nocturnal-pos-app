<?php

namespace App\Repositories;

use App\Models\Business;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

interface BusinessRepository
{
    /**
     * Get all businesses or query builder.
     */
    public function query(): Builder;

    /**
     * Find a business by ID.
     */
    public function find(int $id): ?Business;

    /**
     * Find a business by ID or fail.
     */
    public function findOrFail(int $id): Business;

    /**
     * Create a new business.
     */
    public function create(array $data): Business;

    /**
     * Update an existing business.
     */
    public function update(int $id, array $data): Business;

    /**
     * Delete a business (soft delete).
     */
    public function delete(int $id): bool;
}
