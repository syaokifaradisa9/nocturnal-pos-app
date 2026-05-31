<?php

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;

class EloquentProductRepository implements ProductRepository
{
    /**
     * Get all products or query builder.
     */
    public function query(): Builder
    {
        return Product::query();
    }

    /**
     * Find a product by ID.
     */
    public function find(int $id): ?Product
    {
        return Product::find($id);
    }

    /**
     * Find a product by ID or fail.
     */
    public function findOrFail(int $id): Product
    {
        return Product::findOrFail($id);
    }

    /**
     * Create a new product.
     */
    public function create(array $data): Product
    {
        return Product::create($data);
    }

    /**
     * Update an existing product.
     */
    public function update(int $id, array $data): Product
    {
        $product = $this->findOrFail($id);
        $product->update($data);
        return $product;
    }

    /**
     * Delete a product.
     */
    public function delete(int $id): bool
    {
        $product = $this->findOrFail($id);
        return $product->delete();
    }
}
