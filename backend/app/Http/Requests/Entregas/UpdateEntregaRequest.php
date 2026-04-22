<?php

namespace App\Http\Requests\Entregas;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEntregaRequest extends FormRequest
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
            'material_id' => ['sometimes', 'integer', 'exists:materiais,id'],
            'familia_id' => ['sometimes', 'nullable', 'integer', 'exists:familias,id', 'required_without:acolhido_id'],
            'acolhido_id' => ['sometimes', 'nullable', 'integer', 'exists:acolhidos,id', 'required_without:familia_id'],
            'quantidade' => ['sometimes', 'integer', 'min:1'],
            'data_entrega' => ['sometimes', 'date'],
            'observacoes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
