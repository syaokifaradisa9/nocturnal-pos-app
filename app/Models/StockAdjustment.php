<?php

namespace App\Models;

use App\Enums\StockAdjustmentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['adjustment_number', 'adjustment_date', 'notes', 'status', 'user_id', 'branch_id'])]
class StockAdjustment extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'adjustment_date' => 'date',
        'status' => StockAdjustmentStatus::class,
    ];

    /**
     * Get the user who created this stock adjustment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the branch where this stock adjustment was performed.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the items for this stock adjustment.
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockAdjustmentItem::class);
    }
}
