<?php

namespace App\Repositories;

use App\Models\PurchaseReceiptItem;
use Illuminate\Database\Eloquent\Builder;

interface PurchaseReceiptItemRepository
{
    /**
     * Get query builder.
     */
    public function query(): Builder;

    /**
     * Find a purchase receipt item by ID.
     */
    public function find(int $id): ?PurchaseReceiptItem;

    /**
     * Find a purchase receipt item by ID or fail.
     */
    public function findOrFail(int $id): PurchaseReceiptItem;

    /**
     * Create a new purchase receipt item.
     */
    public function create(array $data): PurchaseReceiptItem;

    /**
     * Update an existing purchase receipt item.
     */
    public function update(int $id, array $data): PurchaseReceiptItem;

    /**
     * Delete a purchase receipt item (soft delete).
     */
    public function delete(int $id): bool;

    /**
     * Create multiple items for a receipt.
     */
    public function createMany(int $purchaseReceiptId, array $items): array;

    /**
     * Delete all items for a receipt.
     */
    public function deleteByReceiptId(int $purchaseReceiptId): bool;
}
