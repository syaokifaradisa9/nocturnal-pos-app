<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransactionRequest extends FormRequest
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
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'in:completed,draft'],
            'payment_method' => ['required_if:status,completed', 'nullable', 'string', 'in:Cash,Transfer,QRIS'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_item_id' => ['required', 'integer', 'exists:product_items,id'],
            'items.*.product_item_measurement_id' => ['required', 'integer', 'exists:product_item_measurements,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.0001'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'customers' => ['nullable', 'array'],
            'customers.name' => ['required_with:customers', 'string', 'max:255'],
            'customers.phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
