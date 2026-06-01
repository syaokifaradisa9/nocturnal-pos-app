<?php

namespace App\Http\Requests;

use App\Enums\UserPermission;
use Illuminate\Foundation\Http\FormRequest;

class SupplierRequest extends FormRequest
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
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ];

        $user = $this->user();
        if ($user) {
            if ($user->hasPermission(UserPermission::VIEW_ANY_SUPPLIER)) {
                $rules['business_ids'] = ['required', 'array', 'min:1'];
                $rules['business_ids.*'] = ['exists:businesses,id'];
            } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_SUPPLIER)) {
                $businessCount = $user->businesses()->count();
                if ($businessCount > 1) {
                    $rules['business_ids'] = ['required', 'array', 'min:1'];
                    $rules['business_ids.*'] = ['exists:businesses,id'];
                } else {
                    $rules['business_ids'] = ['nullable', 'array'];
                    $rules['business_ids.*'] = ['exists:businesses,id'];
                }
            } else {
                $rules['business_ids'] = ['nullable', 'array'];
                $rules['business_ids.*'] = ['exists:businesses,id'];
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
            'name.required' => 'Nama supplier wajib diisi.',
            'name.string' => 'Nama supplier harus berupa string.',
            'name.max' => 'Nama supplier maksimal 255 karakter.',
            'business_ids.required' => 'Bisnis wajib dipilih minimal satu.',
            'business_ids.array' => 'Format bisnis tidak valid.',
            'business_ids.min' => 'Bisnis wajib dipilih minimal satu.',
            'business_ids.*.exists' => 'Bisnis yang dipilih tidak valid.',
        ];
    }
}
