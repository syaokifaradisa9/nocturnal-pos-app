<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['supplier_id', 'branch_id', 'receipt_number', 'receipt_date', 'status', 'notes'])]
class PurchaseReceipt extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Get the supplier for the purchase receipt.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the branch for the purchase receipt.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the items for the purchase receipt.
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseReceiptItem::class);
    }

    /**
     * Get the rejects for the purchase receipt.
     */
    public function rejects(): HasMany
    {
        return $this->hasMany(PurchaseReceiptReject::class);
    }
}
