<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'unique:users,email'],
            'password'  => ['required', Password::min(6)->mixedCase()->symbols()],
            'role'      => ['required', 'in:' . implode(',', User::roles())],
            'phone'     => ['nullable', 'string', 'max:30'],
            'documento' => ['nullable', 'string', 'size:11', 'unique:users,documento'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique'     => 'Este e-mail já está cadastrado.',
            'documento.unique' => 'Este CPF já está cadastrado.',
            'documento.size'   => 'O CPF deve ter 11 dígitos (apenas números, sem pontuação).',
            'role.in'          => 'Perfil inválido. Use: ' . implode(', ', User::roles()) . '.',
        ];
    }
}
