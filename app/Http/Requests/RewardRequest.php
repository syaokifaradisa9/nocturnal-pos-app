<?php

namespace App\Http\Requests;

use App\Enums\UserPermission;
use Illuminate\Foundation\Http\FormRequest;

class RewardRequest extends FormRequest
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
            'description' => ['nullable', 'string'],
            'minimum_point' => ['required', 'integer', 'min:0'],
        ];

        $user = $this->user();
        if ($user) {
            if ($user->hasPermission(UserPermission::VIEW_ANY_REWARD)) {
                $rules['business_id'] = ['required', 'exists:businesses,id'];
            } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_REWARD)) {
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
            'name.required' => 'Nama reward wajib diisi.',
            'name.string' => 'Nama reward harus berupa string.',
            'name.max' => 'Nama reward maksimal 255 karakter.',
            'minimum_point.required' => 'Poin minimum wajib diisi.',
            'minimum_point.integer' => 'Poin minimum harus berupa angka.',
            'minimum_point.min' => 'Poin minimum tidak boleh kurang dari 0.',
            'business_id.required' => 'Bisnis wajib dipilih.',
            'business_id.exists' => 'Bisnis yang dipilih tidak valid.',
        ];
    }
}
