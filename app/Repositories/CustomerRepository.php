<?php

namespace App\Repositories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Builder;

interface CustomerRepository
{
    /**
     * Get all customers or query builder.
     */
    public function query(): Builder;

    /**
     * Find a customer by ID.
     */
    public function find(int $id): ?Customer;

    /**
     * Find a customer by ID or fail.
     */
    public function findOrFail(int $id): Customer;

    /**
     * Create a new customer.
     */
    public function create(array $data): Customer;

    /**
     * Update an existing customer.
     */
    public function update(int $id, array $data): Customer;

    /**
     * Delete a customer (soft delete).
     */
    public function delete(int $id): bool;
}
