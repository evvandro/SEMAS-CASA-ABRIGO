<?php

namespace App\Http\Requests\Familias;

use Illuminate\Foundation\Http\FormRequest;

class RegistrarSaidaFamiliaRequest extends FormRequest
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
            'data_saida' => ['required', 'date'],
            'tipo_saida' => ['required', 'string', 'max:80'],
        ];
    }
}
