<?php

namespace App\Http\Requests;

use App\Enums\UserPermission;
use Illuminate\Foundation\Http\FormRequest;

class BusinessRequest extends FormRequest
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
            'description' => ['required', 'string'],
        ];

        $user = $this->user();
        if ($user && (
            $user->hasPermission(UserPermission::CREATE_ANY_BUSINESS) ||
            $user->hasPermission(UserPermission::EDIT_ANY_BUSINESS) ||
            $user->hasPermission(UserPermission::VIEW_ANY_BUSINESS)
        )) {
            $rules['user_id'] = ['required', 'exists:users,id'];
        }

        return $rules;
    }

    /**
     * Get the custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama bisnis wajib diisi.',
            'name.string' => 'Nama bisnis harus berupa string.',
            'name.max' => 'Nama bisnis maksimal 255 karakter.',
            'description.required' => 'Deskripsi wajib diisi.',
            'description.string' => 'Deskripsi harus berupa string.',
            'user_id.required' => 'Owner wajib diisi.',
            'user_id.exists' => 'Owner yang dipilih tidak valid.',
        ];
    }
}
