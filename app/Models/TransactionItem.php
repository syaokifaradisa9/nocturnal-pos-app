<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['transaction_id', 'product_name', 'measurement_name', 'product_item_measurement_id', 'quantity', 'price'])]
class TransactionItem extends Model
{
    use HasFactory;

    // Explicitly set table name as specified in the request
    protected $table = 'transaction_item';

    protected $casts = [
        'quantity' => 'decimal:4',
        'price' => 'decimal:2',
    ];

    /**
     * Get the transaction that owns the item.
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Get the measurement associated with this transaction item.
     */
    public function productItemMeasurement(): BelongsTo
    {
        return $this->belongsTo(ProductItemMeasurement::class, 'product_item_measurement_id');
    }
}
