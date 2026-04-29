<?php

namespace App\Http\Requests\Materiais;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaterialRequest extends FormRequest
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
            'nome' => ['sometimes', 'string', 'max:255'],
            'unidade' => ['sometimes', 'string', 'max:30'],
            'categoria' => ['sometimes', 'string', 'max:80'],
            'estoque_atual' => ['sometimes', 'integer', 'min:0'],
            'ativo' => ['sometimes', 'boolean'],
        ];
    }
}
