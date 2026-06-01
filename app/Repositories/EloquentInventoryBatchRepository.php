<?php

namespace App\Repositories;

use App\Models\InventoryBatch;
use Illuminate\Database\Eloquent\Builder;

class EloquentInventoryBatchRepository implements InventoryBatchRepository
{
    /**
     * Get query builder.
     */
    public function query(): Builder
    {
        return InventoryBatch::query();
    }

    /**
     * Find an inventory batch by ID.
     */
    public function find(int $id): ?InventoryBatch
    {
        return InventoryBatch::find($id);
    }

    /**
     * Find an inventory batch by ID or fail.
     */
    public function findOrFail(int $id): InventoryBatch
    {
        return InventoryBatch::findOrFail($id);
    }

    /**
     * Create a new inventory batch.
     */
    public function create(array $data): InventoryBatch
    {
        return InventoryBatch::create($data);
    }

    /**
     * Update an existing inventory batch.
     */
    public function update(int $id, array $data): InventoryBatch
    {
        $batch = $this->findOrFail($id);
        $batch->update($data);
        return $batch;
    }

    /**
     * Delete an inventory batch.
     */
    public function delete(int $id): bool
    {
        $batch = $this->findOrFail($id);
        return $batch->delete();
    }
}
