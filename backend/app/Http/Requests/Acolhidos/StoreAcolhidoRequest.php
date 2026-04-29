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
            'familia_id' => ['required', 'integer', 'exists:familias,id'],
            'setor_id' => ['required', 'integer', 'exists:setores,id'],
            'nome' => ['required', 'string', 'max:255'],
            'data_nascimento' => ['required', 'date'],
            'cpf' => ['required', 'string', 'max:20'],
            'telefone' => ['required', 'string', 'max:20'],
            'genero' => ['required', 'string', 'max:30'],
            'leito' => ['required', 'string', 'max:30'],
            'observacoes' => ['required', 'string'],
            'data_entrada' => ['required', 'date'],
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

        $data['data_saida'] = null;
        $data['tipo_saida'] = null;

        return $data;
    }
}
