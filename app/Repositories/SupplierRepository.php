<?php

namespace App\Repositories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Builder;

interface SupplierRepository
{
    /**
     * Get all suppliers or query builder.
     */
    public function query(): Builder;

    /**
     * Find a supplier by ID.
     */
    public function find(int $id): ?Supplier;

    /**
     * Find a supplier by ID or fail.
     */
    public function findOrFail(int $id): Supplier;

    /**
     * Create a new supplier.
     */
    public function create(array $data): Supplier;

    /**
     * Update an existing supplier.
     */
    public function update(int $id, array $data): Supplier;

    /**
     * Delete a supplier (soft delete).
     */
    public function delete(int $id): bool;
}
