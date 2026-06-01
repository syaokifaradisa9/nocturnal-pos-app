<?php

namespace App\Repositories;

use App\Models\PurchaseReceiptReject;
use Illuminate\Database\Eloquent\Builder;

class EloquentPurchaseReceiptRejectRepository implements PurchaseReceiptRejectRepository
{
    /**
     * Get query builder.
     */
    public function query(): Builder
    {
        return PurchaseReceiptReject::query();
    }

    /**
     * Find a purchase receipt reject by ID.
     */
    public function find(int $id): ?PurchaseReceiptReject
    {
        return PurchaseReceiptReject::find($id);
    }

    /**
     * Find a purchase receipt reject by ID or fail.
     */
    public function findOrFail(int $id): PurchaseReceiptReject
    {
        return PurchaseReceiptReject::findOrFail($id);
    }

    /**
     * Create a new purchase receipt reject.
     */
    public function create(array $data): PurchaseReceiptReject
    {
        return PurchaseReceiptReject::create($data);
    }

    /**
     * Update an existing purchase receipt reject.
     */
    public function update(int $id, array $data): PurchaseReceiptReject
    {
        $reject = $this->findOrFail($id);
        $reject->update($data);
        return $reject;
    }

    /**
     * Delete a purchase receipt reject.
     */
    public function delete(int $id): bool
    {
        $reject = $this->findOrFail($id);
        return $reject->delete();
    }

    /**
     * Create multiple rejects for a receipt.
     */
    public function createMany(int $purchaseReceiptId, array $rejects): array
    {
        $created = [];
        foreach ($rejects as $reject) {
            $reject['purchase_receipt_id'] = $purchaseReceiptId;
            $created[] = PurchaseReceiptReject::create($reject);
        }
        return $created;
    }

    /**
     * Delete all rejects for a receipt.
     */
    public function deleteByReceiptId(int $purchaseReceiptId): bool
    {
        return PurchaseReceiptReject::where('purchase_receipt_id', $purchaseReceiptId)->delete() > 0;
    }
}
