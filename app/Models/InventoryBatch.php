<?php

namespace App\Models;

use App\Enums\InventoryBatchStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'product_item_measurement_id',
    'purchase_receipt_item_id',
    'batch_number',
    'initial_quantity',
    'current_quantity',
    'unit_cost',
    'expired_date',
    'status'
])]
class InventoryBatch extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'initial_quantity' => 'decimal:4',
        'current_quantity' => 'decimal:4',
        'unit_cost' => 'decimal:2',
        'expired_date' => 'date',
        'status' => InventoryBatchStatus::class,
    ];

    /**
     * Get the product item measurement associated with this inventory batch.
     */
    public function productItemMeasurement(): BelongsTo
    {
        return $this->belongsTo(ProductItemMeasurement::class);
    }

    /**
     * Get the purchase receipt item associated with this inventory batch.
     */
    public function purchaseReceiptItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceiptItem::class);
    }
}
