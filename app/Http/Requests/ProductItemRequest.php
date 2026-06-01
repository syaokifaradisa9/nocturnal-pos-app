<?php

namespace App\Http\Requests;

use App\Enums\UserPermission;
use Illuminate\Foundation\Http\FormRequest;

class ProductItemRequest extends FormRequest
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
        $rules = [
            'product_id' => ['required', 'exists:products,id'],
            'name' => ['nullable', 'string', 'max:255'],
            'business_ids' => ['nullable', 'array'],
            'business_ids.*' => ['exists:businesses,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.measurement_unit_id' => ['required', 'exists:product_units,id'],
            'items.*.is_base_unit' => ['required', 'boolean'],
            'items.*.conversion_rate' => ['required', 'numeric', 'min:0'],
            'items.*.is_active' => ['nullable', 'boolean'],
        ];

        return $rules;
    }

    /**
     * Get the custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama produk wajib diisi.',
            'name.string' => 'Nama produk harus berupa string.',
            'name.max' => 'Nama produk maksimal 255 karakter.',
            'business_ids.required' => 'Bisnis wajib dipilih minimal satu.',
            'business_ids.array' => 'Format bisnis tidak valid.',
            'business_ids.min' => 'Bisnis wajib dipilih minimal satu.',
            'business_ids.*.exists' => 'Bisnis yang dipilih tidak valid.',
            'items.required' => 'Satuan unit kemasan wajib diisi.',
            'items.array' => 'Format satuan unit kemasan tidak valid.',
            'items.min' => 'Satuan unit kemasan minimal 1.',
            'items.*.measurement_unit_id.required' => 'Satuan unit wajib dipilih.',
            'items.*.measurement_unit_id.exists' => 'Satuan unit yang dipilih tidak valid.',
            'items.*.is_base_unit.required' => 'Status base unit wajib ditentukan.',
            'items.*.conversion_rate.required' => 'Faktor konversi wajib diisi.',
            'items.*.conversion_rate.numeric' => 'Faktor konversi harus berupa angka.',
            'items.*.conversion_rate.min' => 'Faktor konversi tidak boleh kurang dari 0.',
        ];
    }
}
