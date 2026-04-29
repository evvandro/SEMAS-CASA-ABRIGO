<?php

namespace App\Http\Requests\Acolhidos;

use Illuminate\Foundation\Http\FormRequest;

class RegistrarSaidaAcolhidoRequest extends FormRequest
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
