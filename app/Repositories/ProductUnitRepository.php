<?php

namespace App\Repositories;

use App\Models\ProductUnit;
use Illuminate\Database\Eloquent\Builder;

interface ProductUnitRepository
{
    /**
     * Get all product units or query builder.
     */
    public function query(): Builder;

    /**
     * Find a product unit by ID.
     */
    public function find(int $id): ?ProductUnit;

    /**
     * Find a product unit by ID or fail.
     */
    public function findOrFail(int $id): ProductUnit;

    /**
     * Create a new product unit.
     */
    public function create(array $data): ProductUnit;

    /**
     * Update an existing product unit.
     */
    public function update(int $id, array $data): ProductUnit;

    /**
     * Delete a product unit (soft delete).
     */
    public function delete(int $id): bool;
}
