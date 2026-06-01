<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name'])]
class Product extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The businesses associated with the product.
     */
    public function businesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'business_products');
    }

    /**
     * Get the items (SKU/variants) for the product.
     */
    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProductItem::class);
    }
}
