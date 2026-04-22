<?php

namespace App\Http\Requests\Acolhidos;

use App\Models\Acolhido;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAcolhidoRequest extends FormRequest
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
            'codigo_pulseira' => ['sometimes', 'string', 'max:8', Rule::unique('acolhidos', 'codigo_pulseira')],
            'familia_id' => ['nullable', 'integer', 'exists:familias,id'],
            'setor_id' => ['nullable', 'integer', 'exists:setores,id'],
            'nome' => ['required', 'string', 'max:255'],
            'data_nascimento' => ['nullable', 'date'],
            'cpf' => ['nullable', 'string', 'max:20'],
            'telefone' => ['nullable', 'string', 'max:20'],
            'genero' => ['nullable', 'string', 'max:30'],
            'leito' => ['nullable', 'string', 'max:30'],
            'observacoes' => ['nullable', 'string'],
            'data_entrada' => ['required', 'date'],
            'data_saida' => ['nullable', 'date'],
            'tipo_saida' => ['nullable', 'string', 'max:80'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        if (! array_key_exists('codigo_pulseira', $data) || $data['codigo_pulseira'] === null || $data['codigo_pulseira'] === '') {
            $data['codigo_pulseira'] = Acolhido::gerarCodigoPulseira();
        }

        return $data;
    }
}
