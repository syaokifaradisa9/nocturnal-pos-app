<?php

namespace App\Repositories;

use App\Models\InventoryBatch;
use Illuminate\Database\Eloquent\Builder;

interface InventoryBatchRepository
{
    /**
     * Get query builder.
     */
    public function query(): Builder;

    /**
     * Find an inventory batch by ID.
     */
    public function find(int $id): ?InventoryBatch;

    /**
     * Find an inventory batch by ID or fail.
     */
    public function findOrFail(int $id): InventoryBatch;

    /**
     * Create a new inventory batch.
     */
    public function create(array $data): InventoryBatch;

    /**
     * Update an existing inventory batch.
     */
    public function update(int $id, array $data): InventoryBatch;

    /**
     * Delete an inventory batch.
     */
    public function delete(int $id): bool;
}
