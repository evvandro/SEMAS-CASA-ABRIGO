<?php

namespace App\Http\Requests\Entregas;

use Illuminate\Foundation\Http\FormRequest;

class StoreEntregaRequest extends FormRequest
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
            'material_id' => ['required', 'integer', 'exists:materiais,id'],
            'familia_id' => ['nullable', 'integer', 'exists:familias,id', 'required_without:acolhido_id'],
            'acolhido_id' => ['nullable', 'integer', 'exists:acolhidos,id', 'required_without:familia_id'],
            'quantidade' => ['required', 'integer', 'min:1'],
            'data_entrega' => ['required', 'date'],
            'observacoes' => ['nullable', 'string'],
        ];
    }
}
