<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\StockAdjustmentStatus;
use Illuminate\Validation\Rules\Enum;

class StockAdjustmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'adjustment_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'status' => ['required', new Enum(StockAdjustmentStatus::class)],
            'items' => ['nullable', 'array'],
            'items.*.inventory_batch_id' => ['required', 'exists:inventory_batches,id'],
            'items.*.current_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.physical_quantity' => ['required', 'numeric', 'min:0'],
            'items.*.note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
