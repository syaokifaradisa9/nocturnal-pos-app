<?php

namespace App\Repositories;

use App\Models\PurchaseReceiptReject;
use Illuminate\Database\Eloquent\Builder;

interface PurchaseReceiptRejectRepository
{
    /**
     * Get query builder.
     */
    public function query(): Builder;

    /**
     * Find a purchase receipt reject by ID.
     */
    public function find(int $id): ?PurchaseReceiptReject;

    /**
     * Find a purchase receipt reject by ID or fail.
     */
    public function findOrFail(int $id): PurchaseReceiptReject;

    /**
     * Create a new purchase receipt reject.
     */
    public function create(array $data): PurchaseReceiptReject;

    /**
     * Update an existing purchase receipt reject.
     */
    public function update(int $id, array $data): PurchaseReceiptReject;

    /**
     * Delete a purchase receipt reject (soft delete).
     */
    public function delete(int $id): bool;

    /**
     * Create multiple rejects for a receipt.
     */
    public function createMany(int $purchaseReceiptId, array $rejects): array;

    /**
     * Delete all rejects for a receipt.
     */
    public function deleteByReceiptId(int $purchaseReceiptId): bool;
}
