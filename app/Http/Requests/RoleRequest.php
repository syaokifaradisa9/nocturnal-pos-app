<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends FormRequest
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
        $roleId = $this->route('id');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($roleId),
            ],
            'description' => ['nullable', 'string'],
            'permission_ids' => ['required', 'array', 'min:1'],
            'permission_ids.*' => ['exists:permissions,id'],
        ];
    }

    /**
     * Get the custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama role wajib diisi.',
            'name.unique' => 'Nama role sudah terdaftar.',
            'permission_ids.required' => 'Akses permission wajib dipilih minimal satu.',
            'permission_ids.array' => 'Format permission tidak valid.',
            'permission_ids.min' => 'Akses permission wajib dipilih minimal satu.',
            'permission_ids.*.exists' => 'Permission yang dipilih tidak valid.',
        ];
    }
}
