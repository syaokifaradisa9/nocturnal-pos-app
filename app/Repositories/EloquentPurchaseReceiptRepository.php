<?php

namespace App\Repositories;

use App\Models\PurchaseReceipt;
use Illuminate\Database\Eloquent\Builder;

class EloquentPurchaseReceiptRepository implements PurchaseReceiptRepository
{
    /**
     * Get all purchase receipts or query builder.
     */
    public function query(): Builder
    {
        return PurchaseReceipt::query();
    }

    /**
     * Find a purchase receipt by ID.
     */
    public function find(int $id): ?PurchaseReceipt
    {
        return PurchaseReceipt::find($id);
    }

    /**
     * Find a purchase receipt by ID or fail.
     */
    public function findOrFail(int $id): PurchaseReceipt
    {
        return PurchaseReceipt::findOrFail($id);
    }

    /**
     * Create a new purchase receipt.
     */
    public function create(array $data): PurchaseReceipt
    {
        return PurchaseReceipt::create($data);
    }

    /**
     * Update an existing purchase receipt.
     */
    public function update(int $id, array $data): PurchaseReceipt
    {
        $receipt = $this->findOrFail($id);
        $receipt->update($data);
        return $receipt;
    }

    /**
     * Delete a purchase receipt.
     */
    public function delete(int $id): bool
    {
        $receipt = $this->findOrFail($id);
        return $receipt->delete();
    }
}
