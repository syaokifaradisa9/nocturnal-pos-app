<?php

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;

interface ProductRepository
{
    /**
     * Get all products or query builder.
     */
    public function query(): Builder;

    /**
     * Find a product by ID.
     */
    public function find(int $id): ?Product;

    /**
     * Find a product by ID or fail.
     */
    public function findOrFail(int $id): Product;

    /**
     * Create a new product.
     */
    public function create(array $data): Product;

    /**
     * Update an existing product.
     */
    public function update(int $id, array $data): Product;

    /**
     * Delete a product.
     */
    public function delete(int $id): bool;
}
