<?php

namespace App\Http\Requests;

use App\Enums\UserPermission;
use Illuminate\Foundation\Http\FormRequest;

class BranchRequest extends FormRequest
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
            'address' => ['required', 'string'],
            'opening_time' => ['nullable', 'string'],
            'end_time' => ['nullable', 'string'],
        ];

        $user = $this->user();
        if ($user) {
            if ($user->hasPermission(UserPermission::VIEW_ANY_BRANCH)) {
                $rules['business_id'] = ['required', 'exists:businesses,id'];
            } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_BRANCH)) {
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
            'name.required' => 'Nama cabang wajib diisi.',
            'name.string' => 'Nama cabang harus berupa string.',
            'name.max' => 'Nama cabang maksimal 255 karakter.',
            'address.required' => 'Alamat cabang wajib diisi.',
            'address.string' => 'Alamat cabang harus berupa string.',
            'business_id.required' => 'Bisnis wajib diisi.',
            'business_id.exists' => 'Bisnis yang dipilih tidak valid.',
        ];
    }
}
