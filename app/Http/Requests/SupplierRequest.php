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
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:50'],
            'address' => ['required', 'string'],
            'description' => ['required', 'string'],
        ];

        $user = $this->user();
        if ($user) {
            if ($user->hasPermission(UserPermission::CREATE_ANY_SUPPLIER)) {
                $rules['business_ids'] = ['required', 'array', 'min:1'];
                $rules['business_ids.*'] = ['exists:businesses,id'];
            } else if (
                $user->hasPermission(UserPermission::CREATE_OWN_SUPPLIER)
            ) {
                $rules['business_ids'] = ['required', 'array', 'min:1'];
                $rules['business_ids.*'] = ['exists:businesses,id'];
            } else if ($user->hasPermission(UserPermission::CREATE_ASSOCIATED_SUPPLIER)) {
                $businessCount = $user->businesses()->count();
                if ($businessCount > 1) {
                    $rules['business_ids'] = ['required', 'array', 'min:1'];
                    $rules['business_ids.*'] = ['exists:businesses,id'];
                } else {
                    $rules['business_ids'] = ['nullable', 'array'];
                    $rules['business_ids.*'] = ['exists:businesses,id'];
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
            'name.required' => 'Nama supplier wajib diisi.',
            'name.string' => 'Nama supplier harus berupa string.',
            'name.max' => 'Nama supplier maksimal 255 karakter.',
            'contact_name.required' => 'Nama kontak wajib diisi.',
            'contact_phone.required' => 'Telepon kontak wajib diisi.',
            'address.required' => 'Alamat wajib diisi.',
            'description.required' => 'Deskripsi wajib diisi.',
            'business_ids.required' => 'Bisnis wajib dipilih minimal satu.',
            'business_ids.array' => 'Format bisnis tidak valid.',
            'business_ids.min' => 'Bisnis wajib dipilih minimal satu.',
            'business_ids.*.exists' => 'Bisnis yang dipilih tidak valid.',
        ];
    }
}
