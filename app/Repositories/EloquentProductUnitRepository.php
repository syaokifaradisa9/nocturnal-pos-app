<?php

namespace App\Repositories;

use App\Models\ProductUnit;
use Illuminate\Database\Eloquent\Builder;

class EloquentProductUnitRepository implements ProductUnitRepository
{
    /**
     * Get all product units or query builder.
     */
    public function query(): Builder
    {
        return ProductUnit::query();
    }

    /**
     * Find a product unit by ID.
     */
    public function find(int $id): ?ProductUnit
    {
        return ProductUnit::find($id);
    }

    /**
     * Find a product unit by ID or fail.
     */
    public function findOrFail(int $id): ProductUnit
    {
        return ProductUnit::findOrFail($id);
    }

    /**
     * Create a new product unit.
     */
    public function create(array $data): ProductUnit
    {
        return ProductUnit::create($data);
    }

    /**
     * Update an existing product unit.
     */
    public function update(int $id, array $data): ProductUnit
    {
        $unit = $this->findOrFail($id);
        $unit->update($data);
        return $unit;
    }

    /**
     * Delete a product unit.
     */
    public function delete(int $id): bool
    {
        $unit = $this->findOrFail($id);
        return $unit->delete();
    }
}
