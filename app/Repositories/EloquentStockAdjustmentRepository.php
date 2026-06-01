<?php

namespace App\Repositories;

use App\Models\StockAdjustment;
use Illuminate\Database\Eloquent\Builder;

class EloquentStockAdjustmentRepository implements StockAdjustmentRepository
{
    /**
     * Get query builder.
     */
    public function query(): Builder
    {
        return StockAdjustment::query();
    }

    /**
     * Find a stock adjustment by ID.
     */
    public function find(int $id): ?StockAdjustment
    {
        return StockAdjustment::find($id);
    }

    /**
     * Find a stock adjustment by ID or fail.
     */
    public function findOrFail(int $id): StockAdjustment
    {
        return StockAdjustment::findOrFail($id);
    }

    /**
     * Create a new stock adjustment.
     */
    public function create(array $data): StockAdjustment
    {
        return StockAdjustment::create($data);
    }

    /**
     * Update an existing stock adjustment.
     */
    public function update(int $id, array $data): StockAdjustment
    {
        $adjustment = $this->findOrFail($id);
        $adjustment->update($data);
        return $adjustment;
    }

    /**
     * Delete a stock adjustment.
     */
    public function delete(int $id): bool
    {
        $adjustment = $this->findOrFail($id);
        return $adjustment->delete();
    }
}
