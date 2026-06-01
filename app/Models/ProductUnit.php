<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'short_name', 'description', 'allow_decimal', 'business_id'])]
class ProductUnit extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'allow_decimal' => 'boolean',
    ];

    /**
     * Get the business that owns the product unit.
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
