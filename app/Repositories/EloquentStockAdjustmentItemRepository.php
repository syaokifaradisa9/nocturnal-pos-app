<?php

namespace App\Repositories;

use App\Models\StockAdjustmentItem;

class EloquentStockAdjustmentItemRepository implements StockAdjustmentItemRepository
{
    /**
     * Create many stock adjustment items.
     */
    public function createMany(int $adjustmentId, array $items): array
    {
        $created = [];
        foreach ($items as $item) {
            $created[] = StockAdjustmentItem::create(array_merge($item, [
                'stock_adjustment_id' => $adjustmentId
            ]));
        }
        return $created;
    }

    /**
     * Delete stock adjustment items by adjustment ID.
     */
    public function deleteByAdjustmentId(int $adjustmentId): bool
    {
        return StockAdjustmentItem::where('stock_adjustment_id', $adjustmentId)->delete() >= 0;
    }
}
