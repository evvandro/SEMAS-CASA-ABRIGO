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
        $acolhido = $this->route('acolhido');
        $acolhidoId = $acolhido instanceof Acolhido ? $acolhido->id : null;

        return [
            'codigo_pulseira' => ['sometimes', 'string', 'max:8', Rule::unique('acolhidos', 'codigo_pulseira')->ignore($acolhidoId)],
            'familia_id' => ['sometimes', 'integer', 'exists:familias,id'],
            'setor_id' => ['sometimes', 'integer', 'exists:setores,id'],
            'nome' => ['sometimes', 'string', 'max:255'],
            'data_nascimento' => ['sometimes', 'date'],
            'cpf' => ['sometimes', 'string', 'max:20'],
            'telefone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'genero' => ['sometimes', 'nullable', 'string', 'max:30'],
            'leito' => ['sometimes', 'nullable', 'string', 'max:30'],
            'observacoes' => ['sometimes', 'nullable', 'string'],
            'pertences_registrados' => ['sometimes', 'nullable', 'string'],
            'data_entrada' => ['sometimes', 'date'],
            'hora_entrada' => ['sometimes', 'nullable', 'date_format:H:i'],
            'pcd' => ['sometimes', 'boolean'],
            'gestante' => ['sometimes', 'boolean'],
            'cronica' => ['sometimes', 'boolean'],
            'idoso' => ['sometimes', 'boolean'],
        ];
    }
}
