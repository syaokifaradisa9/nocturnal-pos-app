<?php

namespace App\Repositories;

use App\Models\StockAdjustment;
use Illuminate\Database\Eloquent\Builder;

interface StockAdjustmentRepository
{
    /**
     * Get query builder.
     */
    public function query(): Builder;

    /**
     * Find a stock adjustment by ID.
     */
    public function find(int $id): ?StockAdjustment;

    /**
     * Find a stock adjustment by ID or fail.
     */
    public function findOrFail(int $id): StockAdjustment;

    /**
     * Create a new stock adjustment.
     */
    public function create(array $data): StockAdjustment;

    /**
     * Update an existing stock adjustment.
     */
    public function update(int $id, array $data): StockAdjustment;

    /**
     * Delete a stock adjustment.
     */
    public function delete(int $id): bool;
}
