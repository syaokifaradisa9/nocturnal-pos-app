<?php

namespace App\Repositories;

use App\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;

interface TransactionRepository
{
    /**
     * Get transaction query builder.
     */
    public function query(): Builder;

    /**
     * Find a transaction by ID.
     */
    public function find(int $id): ?Transaction;

    /**
     * Find a transaction by ID or fail.
     */
    public function findOrFail(int $id): Transaction;

    /**
     * Create a new transaction.
     */
    public function create(array $data): Transaction;

    /**
     * Update an existing transaction.
     */
    public function update(int $id, array $data): Transaction;

    /**
     * Delete a transaction.
     */
    public function delete(int $id): bool;
}
