<?php

namespace App\Http\Requests\Acolhidos;

use App\Models\Acolhido;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAcolhidoRequest extends FormRequest
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
        /** @var Acolhido $acolhido */
        $acolhido = $this->route('acolhido');

        return [
            'codigo_pulseira' => ['sometimes', 'string', 'max:8', Rule::unique('acolhidos', 'codigo_pulseira')->ignore($acolhido->id)],
            'familia_id' => ['sometimes', 'nullable', 'integer', 'exists:familias,id'],
            'setor_id' => ['sometimes', 'nullable', 'integer', 'exists:setores,id'],
            'nome' => ['sometimes', 'string', 'max:255'],
            'data_nascimento' => ['sometimes', 'nullable', 'date'],
            'cpf' => ['sometimes', 'nullable', 'string', 'max:20'],
            'telefone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'genero' => ['sometimes', 'nullable', 'string', 'max:30'],
            'leito' => ['sometimes', 'nullable', 'string', 'max:30'],
            'observacoes' => ['sometimes', 'nullable', 'string'],
            'data_entrada' => ['sometimes', 'date'],
            'data_saida' => ['sometimes', 'nullable', 'date'],
            'tipo_saida' => ['sometimes', 'nullable', 'string', 'max:80'],
        ];
    }
}
