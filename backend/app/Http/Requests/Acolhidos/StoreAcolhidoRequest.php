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
            'codigo_pulseira' => ['sometimes', 'nullable', 'string', 'max:8', Rule::unique('acolhidos', 'codigo_pulseira')],
            'familia_id' => ['nullable', 'integer', 'exists:familias,id'],
            'setor_id' => ['required', 'integer', 'exists:setores,id'],
            'nome' => ['required', 'string', 'max:255'],
            'data_nascimento' => ['nullable', 'date'],
            'cpf' => ['nullable', 'regex:/^\d{11}$/'],
            'parentesco' => ['nullable', 'string', 'max:100'],
            'telefone' => ['nullable', 'string', 'max:20'],
            'genero' => ['nullable', 'string', 'max:30'],
            'leito' => ['nullable', 'string', 'max:30'],
            'observacoes' => ['nullable', 'string'],
            'pertences_registrados' => ['nullable', 'string'],
            'data_entrada' => ['nullable', 'date'],
            'hora_entrada' => ['nullable', 'date_format:H:i'],
            'pcd' => ['nullable', 'boolean'],
            'gestante' => ['nullable', 'boolean'],
            'cronica' => ['nullable', 'boolean'],
            'idoso' => ['nullable', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('cpf')) {
            $digits = preg_replace('/\D+/', '', (string) $this->input('cpf'));
            $this->merge(['cpf' => $digits ?: null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        if (empty($data['codigo_pulseira'])) {
            $data['codigo_pulseira'] = Acolhido::gerarCodigoPulseira();
        }

        if (empty($data['data_entrada'])) {
            $data['data_entrada'] = now()->toDateString();
        }

        $data['data_saida'] = null;
        $data['tipo_saida'] = null;

        return $data;
    }
}
