<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'description', 'minimum_point', 'business_id'])]
class Reward extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'minimum_point' => 'integer',
    ];

    /**
     * Get the business that owns the reward.
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
