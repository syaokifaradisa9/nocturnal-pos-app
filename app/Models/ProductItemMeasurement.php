<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['product_item_id', 'measurement_unit_id', 'target_measurement_unit_id', 'is_base_unit', 'conversion_rate'])]
class ProductItemMeasurement extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'is_base_unit' => 'boolean',
        'conversion_rate' => 'decimal:4',
    ];

    /**
     * Get the product item associated with this measurement.
     */
    public function productItem(): BelongsTo
    {
        return $this->belongsTo(ProductItem::class);
    }

    /**
     * Get the measurement unit associated with this item.
     */
    public function measurementUnit(): BelongsTo
    {
        return $this->belongsTo(ProductUnit::class, 'measurement_unit_id');
    }

    /**
     * Get the target measurement unit associated with this item.
     */
    public function targetMeasurementUnit(): BelongsTo
    {
        return $this->belongsTo(ProductUnit::class, 'target_measurement_unit_id');
    }

    /**
     * Get the price tierings for this measurement unit.
     */
    public function priceTierings(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProductPriceTiering::class, 'product_item_measurement_id');
    }
}
