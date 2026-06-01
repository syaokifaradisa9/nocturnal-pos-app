<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'contact_name', 'contact_phone', 'address', 'description'])]
class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The businesses associated with the supplier.
     */
    public function businesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'business_suppliers');
    }
}
