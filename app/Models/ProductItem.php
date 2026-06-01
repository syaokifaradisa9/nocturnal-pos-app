<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['product_id', 'measurement_unit_id', 'is_base_unit', 'conversion_rate', 'is_active'])]
class ProductItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'is_base_unit' => 'boolean',
        'is_active' => 'boolean',
        'conversion_rate' => 'decimal:4',
    ];

    /**
     * Get the product associated with this item.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the measurement unit associated with this item.
     */
    public function measurementUnit(): BelongsTo
    {
        return $this->belongsTo(ProductUnit::class, 'measurement_unit_id');
    }
}
