<?php

namespace App\Http\Requests\Familias;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFamiliaRequest extends FormRequest
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
            'responsavel_nome' => ['sometimes', 'string', 'max:255'],
            'setor_id' => ['sometimes', 'integer', 'exists:setores,id'],
            'observacoes' => ['sometimes', 'string'],
            'data_entrada' => ['sometimes', 'date'],
        ];
    }
}
