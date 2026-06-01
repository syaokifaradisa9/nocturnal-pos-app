<?php

namespace App\Http\Requests;

use App\Enums\UserPermission;
use Illuminate\Foundation\Http\FormRequest;

class ProductUnitRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'short_name' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'allow_decimal' => ['nullable', 'boolean'],
        ];

        $user = $this->user();
        if ($user) {
            if ($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_UNIT)) {
                $rules['business_id'] = ['required', 'exists:businesses,id'];
            } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT)) {
                $businessCount = $user->businesses()->count();
                if ($businessCount > 1) {
                    $rules['business_id'] = ['required', 'exists:businesses,id'];
                } else {
                    $rules['business_id'] = ['nullable', 'exists:businesses,id'];
                }
            } else {
                $rules['business_id'] = ['nullable', 'exists:businesses,id'];
            }
        }

        return $rules;
    }

    /**
     * Get the custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama satuan produk wajib diisi.',
            'name.string' => 'Nama satuan produk harus berupa string.',
            'name.max' => 'Nama satuan produk maksimal 255 karakter.',
            'short_name.required' => 'Nama pendek satuan wajib diisi.',
            'short_name.string' => 'Nama pendek satuan harus berupa string.',
            'short_name.max' => 'Nama pendek satuan maksimal 50 karakter.',
            'business_id.required' => 'Bisnis wajib dipilih.',
            'business_id.exists' => 'Bisnis yang dipilih tidak valid.',
        ];
    }
}
