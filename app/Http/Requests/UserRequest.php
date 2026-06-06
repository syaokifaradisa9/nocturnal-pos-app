<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
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
        $userId = $this->route('id');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $userId],
            'username' => ['nullable', 'string', 'max:255', 'unique:users,username,' . $userId],
            'password' => $userId 
                ? ['nullable', 'string', Password::min(8)->mixedCase()->symbols()] 
                : ['required', 'string', Password::min(8)->mixedCase()->symbols()],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:20'],
            'business_name' => ['required', 'string', 'max:255'],
            'business_description' => ['nullable', 'string'],
            'branch_name' => ['required', 'string', 'max:255'],
            'branch_address' => ['nullable', 'string'],
            'branch_opening_time' => ['nullable', 'string'],
            'branch_end_time' => ['nullable', 'string'],
            'account_type' => ['required', 'string', 'in:pebisnis,owner_bisnis,owner_cabang'],
        ];
    }

    /**
     * Get the custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'name.string' => 'Nama harus berupa string.',
            'name.max' => 'Nama maksimal 255 karakter.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan.',
            'username.unique' => 'Username sudah digunakan.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 8 karakter.',
            'business_name.required' => 'Nama bisnis wajib diisi.',
            'branch_name.required' => 'Nama cabang wajib diisi.',
            'account_type.required' => 'Jenis akun wajib dipilih.',
            'account_type.in' => 'Jenis akun yang dipilih tidak valid.',
        ];
    }
}
