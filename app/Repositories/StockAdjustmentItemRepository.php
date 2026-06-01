<?php

namespace App\Repositories;

use App\Models\StockAdjustmentItem;

interface StockAdjustmentItemRepository
{
    /**
     * Create many stock adjustment items.
     */
    public function createMany(int $adjustmentId, array $items): array;

    /**
     * Delete stock adjustment items by adjustment ID.
     */
    public function deleteByAdjustmentId(int $adjustmentId): bool;
}
