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
            'telefone' => ['sometimes', 'string', 'max:20'],
            'genero' => ['sometimes', 'string', 'max:30'],
            'leito' => ['sometimes', 'string', 'max:30'],
            'observacoes' => ['sometimes', 'string'],
            'data_entrada' => ['sometimes', 'date'],
        ];
    }
}
