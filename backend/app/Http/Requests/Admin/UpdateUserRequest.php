<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
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
        /** @var User $user */
        $user = $this->route('user');

        return [
            'name'      => ['sometimes', 'string', 'max:255'],
            'email'     => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password'  => ['sometimes', Password::min(6)->mixedCase()->symbols()],
            'role'      => ['sometimes', 'in:' . implode(',', User::roles())],
            'is_active' => ['sometimes', 'boolean'],
            'phone'     => ['sometimes', 'nullable', 'string', 'max:30'],
            'documento' => ['sometimes', 'nullable', 'string', 'size:11', Rule::unique('users')->ignore($user->id)],
        ];
    }
}
