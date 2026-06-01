<?php

namespace App\Repositories;

use App\Models\PurchaseReceiptItem;
use Illuminate\Database\Eloquent\Builder;

class EloquentPurchaseReceiptItemRepository implements PurchaseReceiptItemRepository
{
    /**
     * Get query builder.
     */
    public function query(): Builder
    {
        return PurchaseReceiptItem::query();
    }

    /**
     * Find a purchase receipt item by ID.
     */
    public function find(int $id): ?PurchaseReceiptItem
    {
        return PurchaseReceiptItem::find($id);
    }

    /**
     * Find a purchase receipt item by ID or fail.
     */
    public function findOrFail(int $id): PurchaseReceiptItem
    {
        return PurchaseReceiptItem::findOrFail($id);
    }

    /**
     * Create a new purchase receipt item.
     */
    public function create(array $data): PurchaseReceiptItem
    {
        return PurchaseReceiptItem::create($data);
    }

    /**
     * Update an existing purchase receipt item.
     */
    public function update(int $id, array $data): PurchaseReceiptItem
    {
        $item = $this->findOrFail($id);
        $item->update($data);
        return $item;
    }

    /**
     * Delete a purchase receipt item.
     */
    public function delete(int $id): bool
    {
        $item = $this->findOrFail($id);
        return $item->delete();
    }

    /**
     * Create multiple items for a receipt.
     */
    public function createMany(int $purchaseReceiptId, array $items): array
    {
        $created = [];
        foreach ($items as $item) {
            $item['purchase_receipt_id'] = $purchaseReceiptId;
            $created[] = PurchaseReceiptItem::create($item);
        }
        return $created;
    }

    /**
     * Delete all items for a receipt.
     */
    public function deleteByReceiptId(int $purchaseReceiptId): bool
    {
        return PurchaseReceiptItem::where('purchase_receipt_id', $purchaseReceiptId)->delete() > 0;
    }
}
