<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_item_measurement_id', 'minimum', 'price'])]
class ProductPriceTiering extends Model
{
    use HasFactory;

    protected $casts = [
        'minimum' => 'integer',
        'price' => 'decimal:2',
    ];

    /**
     * Get the measurement unit associated with this price tiering.
     */
    public function productItemMeasurement(): BelongsTo
    {
        return $this->belongsTo(ProductItemMeasurement::class, 'product_item_measurement_id');
    }
}
