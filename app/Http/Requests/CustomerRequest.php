<?php

namespace App\Http\Requests;

use App\Enums\UserPermission;
use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
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
            'phone' => ['nullable', 'string', 'max:50'],
            'current_point' => ['nullable', 'integer', 'min:0'],
        ];

        $user = $this->user();
        if ($user) {
            if ($user->hasPermission(UserPermission::VIEW_ANY_CUSTOMER)) {
                $rules['business_id'] = ['required', 'exists:businesses,id'];
            } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_CUSTOMER)) {
                $businessCount = $user->businesses()->count();
                if ($businessCount > 1) {
                    $rules['business_id'] = ['required', 'exists:businesses,id'];
                } else {
                    $rules['business_id'] = ['nullable', 'exists:businesses,id'];
                }
            } else if (
                $user->hasPermission(UserPermission::VIEW_OWN_CUSTOMER) ||
                $user->hasPermission(UserPermission::CREATE_OWN_CUSTOMER) ||
                $user->hasPermission(UserPermission::EDIT_OWN_CUSTOMER)
            ) {
                $businessCount = \App\Models\Business::where('user_id', $user->id)->count();
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
            'name.required' => 'Nama customer wajib diisi.',
            'name.string' => 'Nama customer harus berupa string.',
            'name.max' => 'Nama customer maksimal 255 karakter.',
            'phone.max' => 'Telepon customer maksimal 50 karakter.',
            'current_point.integer' => 'Poin customer harus berupa angka.',
            'current_point.min' => 'Poin customer tidak boleh negatif.',
            'business_id.required' => 'Bisnis wajib dipilih.',
            'business_id.exists' => 'Bisnis yang dipilih tidak valid.',
        ];
    }
}
