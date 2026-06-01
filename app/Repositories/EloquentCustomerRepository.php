<?php

namespace App\Repositories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Builder;

class EloquentCustomerRepository implements CustomerRepository
{
    /**
     * Get all customers or query builder.
     */
    public function query(): Builder
    {
        return Customer::query();
    }

    /**
     * Find a customer by ID.
     */
    public function find(int $id): ?Customer
    {
        return Customer::find($id);
    }

    /**
     * Find a customer by ID or fail.
     */
    public function findOrFail(int $id): Customer
    {
        return Customer::findOrFail($id);
    }

    /**
     * Create a new customer.
     */
    public function create(array $data): Customer
    {
        return Customer::create($data);
    }

    /**
     * Update an existing customer.
     */
    public function update(int $id, array $data): Customer
    {
        $customer = $this->findOrFail($id);
        $customer->update($data);
        return $customer;
    }

    /**
     * Delete a customer.
     */
    public function delete(int $id): bool
    {
        $customer = $this->findOrFail($id);
        return $customer->delete();
    }
}
