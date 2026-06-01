<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['purchase_receipt_id', 'product_item_measurement_id', 'quantity', 'reason'])]
class PurchaseReceiptReject extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'quantity' => 'decimal:4',
    ];

    /**
     * Get the purchase receipt that owns this reject.
     */
    public function purchaseReceipt(): BelongsTo
    {
        return $this->belongsTo(PurchaseReceipt::class);
    }

    /**
     * Get the product item measurement associated with this reject.
     */
    public function productItemMeasurement(): BelongsTo
    {
        return $this->belongsTo(ProductItemMeasurement::class);
    }
}
