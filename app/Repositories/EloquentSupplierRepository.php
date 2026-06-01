<?php

namespace App\Repositories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Builder;

class EloquentSupplierRepository implements SupplierRepository
{
    /**
     * Get all suppliers or query builder.
     */
    public function query(): Builder
    {
        return Supplier::query();
    }

    /**
     * Find a supplier by ID.
     */
    public function find(int $id): ?Supplier
    {
        return Supplier::find($id);
    }

    /**
     * Find a supplier by ID or fail.
     */
    public function findOrFail(int $id): Supplier
    {
        return Supplier::findOrFail($id);
    }

    /**
     * Create a new supplier.
     */
    public function create(array $data): Supplier
    {
        return Supplier::create($data);
    }

    /**
     * Update an existing supplier.
     */
    public function update(int $id, array $data): Supplier
    {
        $supplier = $this->findOrFail($id);
        $supplier->update($data);
        return $supplier;
    }

    /**
     * Delete a supplier.
     */
    public function delete(int $id): bool
    {
        $supplier = $this->findOrFail($id);
        return $supplier->delete();
    }
}
