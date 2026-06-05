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
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (!$this->has('allow_decimal') || is_null($this->input('allow_decimal'))) {
            $this->merge([
                'allow_decimal' => false,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $user = $this->user();
        $businessId = $this->input('business_id');

        if (!$businessId && $user) {
            if ($user->hasPermission(UserPermission::CREATE_ASSOCIATED_PRODUCT_UNIT) || $user->hasPermission(UserPermission::EDIT_ASSOCIATED_PRODUCT_UNIT)) {
                $associated = $user->businesses()->pluck('businesses.id')->toArray();
                if (count($associated) === 1) {
                    $businessId = $associated[0];
                }
            } else if ($user->hasPermission(UserPermission::CREATE_OWN_PRODUCT_UNIT) || $user->hasPermission(UserPermission::EDIT_OWN_PRODUCT_UNIT)) {
                $owned = \App\Models\Business::where('user_id', $user->id)->pluck('id')->toArray();
                if (count($owned) === 1) {
                    $businessId = $owned[0];
                }
            }
        }

        $rules = [
            'name' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('product_units', 'name')
                    ->where(function ($query) use ($businessId) {
                        return $query->where('business_id', $businessId)
                                     ->whereNull('deleted_at');
                    })
                    ->ignore($this->route('id'))
            ],
            'short_name' => ['required', 'string', 'max:50'],
            'description' => ['required', 'string'],
            'allow_decimal' => ['required', 'boolean'],
        ];

        if ($user) {
            if (
                $user->hasPermission(UserPermission::CREATE_ANY_PRODUCT_UNIT) ||
                $user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_UNIT) ||
                $user->hasPermission(UserPermission::EDIT_ANY_PRODUCT_UNIT)
            ) {
                $rules['business_id'] = ['required', 'exists:businesses,id'];
            } else if (
                $user->hasPermission(UserPermission::CREATE_OWN_PRODUCT_UNIT) ||
                $user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_UNIT) ||
                $user->hasPermission(UserPermission::EDIT_OWN_PRODUCT_UNIT)
            ) {
                $rules['business_id'] = ['required', 'exists:businesses,id'];
            } else if (
                $user->hasPermission(UserPermission::CREATE_ASSOCIATED_PRODUCT_UNIT) ||
                $user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT) ||
                $user->hasPermission(UserPermission::EDIT_ASSOCIATED_PRODUCT_UNIT)
            ) {
                $businessCount = $user->businesses()->count();
                if ($businessCount > 1) {
                    $rules['business_id'] = ['required', 'exists:businesses,id'];
                } else {
                    $rules['business_id'] = ['nullable', 'exists:businesses,id'];
                }
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
            'name.unique' => 'Nama satuan produk sudah digunakan dalam bisnis ini.',
            'short_name.required' => 'Nama pendek satuan wajib diisi.',
            'short_name.string' => 'Nama pendek satuan harus berupa string.',
            'short_name.max' => 'Nama pendek satuan maksimal 50 karakter.',
            'description.required' => 'Deskripsi satuan wajib diisi.',
            'allow_decimal.required' => 'Pilihan desimal wajib diisi.',
            'business_id.required' => 'Bisnis wajib dipilih.',
            'business_id.exists' => 'Bisnis yang dipilih tidak valid.',
        ];
    }
}
