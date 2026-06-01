<?php

namespace App\Repositories;

use App\Models\PurchaseReceipt;
use Illuminate\Database\Eloquent\Builder;

interface PurchaseReceiptRepository
{
    /**
     * Get all purchase receipts or query builder.
     */
    public function query(): Builder;

    /**
     * Find a purchase receipt by ID.
     */
    public function find(int $id): ?PurchaseReceipt;

    /**
     * Find a purchase receipt by ID or fail.
     */
    public function findOrFail(int $id): PurchaseReceipt;

    /**
     * Create a new purchase receipt.
     */
    public function create(array $data): PurchaseReceipt;

    /**
     * Update an existing purchase receipt.
     */
    public function update(int $id, array $data): PurchaseReceipt;

    /**
     * Delete a purchase receipt (soft delete).
     */
    public function delete(int $id): bool;
}
