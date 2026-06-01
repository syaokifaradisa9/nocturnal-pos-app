<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['stock_adjustment_id', 'inventory_batch_id', 'current_quantity', 'physical_quantity', 'difference', 'note'])]
class StockAdjustmentItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'current_quantity' => 'decimal:4',
        'physical_quantity' => 'decimal:4',
        'difference' => 'decimal:4',
    ];

    /**
     * Get the stock adjustment header.
     */
    public function stockAdjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class);
    }

    /**
     * Get the inventory batch being adjusted.
     */
    public function inventoryBatch(): BelongsTo
    {
        return $this->belongsTo(InventoryBatch::class);
    }
}
