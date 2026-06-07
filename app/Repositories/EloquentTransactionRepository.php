<?php

namespace App\Repositories;

use App\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;

class EloquentTransactionRepository implements TransactionRepository
{
    /**
     * Get transaction query builder.
     */
    public function query(): Builder
    {
        return Transaction::query();
    }

    /**
     * Find a transaction by ID.
     */
    public function find(int $id): ?Transaction
    {
        return Transaction::find($id);
    }

    /**
     * Find a transaction by ID or fail.
     */
    public function findOrFail(int $id): Transaction
    {
        return Transaction::findOrFail($id);
    }

    /**
     * Create a new transaction.
     */
    public function create(array $data): Transaction
    {
        return Transaction::create($data);
    }

    /**
     * Update an existing transaction.
     */
    public function update(int $id, array $data): Transaction
    {
        $transaction = $this->findOrFail($id);
        $transaction->update($data);
        return $transaction;
    }

    /**
     * Delete a transaction.
     */
    public function delete(int $id): bool
    {
        $transaction = $this->findOrFail($id);
        return $transaction->delete();
    }
}
