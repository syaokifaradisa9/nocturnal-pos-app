<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseReceiptRequest extends FormRequest
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
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'receipt_number' => ['nullable', 'string', 'max:255'],
            'receipt_date' => ['required', 'date'],
            'status' => ['required', 'string', 'in:Draft,Review'],
            'notes' => ['nullable', 'string'],

            // Items validation
            'items' => ['nullable', 'array'],
            'items.*.product_item_measurement_id' => ['required_with:items', 'exists:product_item_measurements,id'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0.0001'],
            'items.*.unit_cost' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.expired_date' => ['required_with:items', 'date'],

            // Rejects validation
            'rejects' => ['nullable', 'array'],
            'rejects.*.product_item_measurement_id' => [
                'required_with:rejects',
                'exists:product_item_measurements,id',
                function ($attribute, $value, $fail) {
                    $items = $this->input('items', []);
                    $itemMeasurementIds = array_column($items, 'product_item_measurement_id');
                    
                    $targetMeasurement = \App\Models\ProductItemMeasurement::find($value);
                    if (!$targetMeasurement) {
                        return;
                    }
                    
                    $allowedProductItemIds = \App\Models\ProductItemMeasurement::whereIn('id', $itemMeasurementIds)
                        ->pluck('product_item_id')
                        ->toArray();
                        
                    if (!in_array($targetMeasurement->product_item_id, $allowedProductItemIds)) {
                        $fail('Produk reject harus memiliki product_id yang sudah dipilih pada pendataan produk.');
                    }
                }
            ],
            'rejects.*.quantity' => ['required_with:rejects', 'numeric', 'min:0.0001'],
            'rejects.*.reason' => ['required_with:rejects', 'string', 'max:255'],
        ];
    }

    /**
     * Get the custom error messages for validation.
     */
    public function messages(): array
    {
        return [
            'supplier_id.required' => 'Supplier wajib dipilih.',
            'supplier_id.exists' => 'Supplier yang dipilih tidak valid.',
            'branch_id.required' => 'Cabang wajib dipilih.',
            'branch_id.exists' => 'Cabang yang dipilih tidak valid.',
            'receipt_date.required' => 'Tanggal penerimaan wajib diisi.',
            'receipt_date.date' => 'Format tanggal penerimaan tidak valid.',
            'status.required' => 'Status wajib diisi.',
            'status.in' => 'Status tidak valid.',
            'items.*.product_item_measurement_id.required_with' => 'Produk wajib dipilih untuk setiap item.',
            'items.*.product_item_measurement_id.exists' => 'Produk yang dipilih tidak valid.',
            'items.*.quantity.required_with' => 'Jumlah wajib diisi untuk setiap item.',
            'items.*.quantity.min' => 'Jumlah minimal 0.0001.',
            'items.*.unit_cost.required_with' => 'Harga satuan wajib diisi untuk setiap item.',
            'items.*.unit_cost.min' => 'Harga satuan tidak boleh negatif.',
            'rejects.*.product_item_measurement_id.required_with' => 'Produk wajib dipilih untuk setiap item reject.',
            'rejects.*.product_item_measurement_id.exists' => 'Produk reject yang dipilih tidak valid.',
            'rejects.*.quantity.required_with' => 'Jumlah wajib diisi untuk setiap item reject.',
            'rejects.*.quantity.min' => 'Jumlah reject minimal 0.0001.',
            'rejects.*.reason.required_with' => 'Alasan wajib diisi untuk setiap item reject.',
        ];
    }
}
