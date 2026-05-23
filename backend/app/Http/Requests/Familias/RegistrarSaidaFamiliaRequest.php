<?php

namespace App\Http\Requests\Familias;

use Illuminate\Foundation\Http\FormRequest;

class RegistrarSaidaFamiliaRequest extends FormRequest
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
            'data_saida' => ['required', 'date'],
            'hora_saida' => ['nullable', 'date_format:H:i:s,H:i'],
            'tipo_saida' => ['required', 'string', 'max:80'],
            'destino_informado' => ['nullable', 'string', 'max:255'],
            'endereco_destino' => ['nullable', 'string', 'max:255'],
            'municipio_destino' => ['nullable', 'string', 'max:255'],
            'telefone_destino' => ['nullable', 'string', 'max:20'],
            'encaminhamentos_rede' => ['nullable', 'array'],
            'encaminhamentos_rede.*' => ['string'],
            'resumo_encaminhamento' => ['nullable', 'string'],
            'condicao_saida' => ['nullable', 'string', 'max:255'],
            'observacoes_tecnicas' => ['nullable', 'string'],
            'responsavel_desligamento' => ['nullable', 'string', 'max:255'],
            'cargo_responsavel' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = $this->all();

        if (empty($data['tipo_saida']) && ! empty($data['tipo_desligamento'])) {
            $data['tipo_saida'] = $data['tipo_desligamento'];
        }

        if (! empty($data['data_saida']) && preg_match('/^\d{2}\/\d{2}\/\d{4}$/', (string) $data['data_saida'])) {
            [$day, $month, $year] = explode('/', (string) $data['data_saida']);
            $data['data_saida'] = "{$year}-{$month}-{$day}";
        }

        foreach ([
            'hora_saida',
            'destino_informado',
            'endereco_destino',
            'municipio_destino',
            'telefone_destino',
            'resumo_encaminhamento',
            'condicao_saida',
            'observacoes_tecnicas',
            'responsavel_desligamento',
            'cargo_responsavel',
        ] as $field) {
            if (array_key_exists($field, $data) && $data[$field] === '') {
                $data[$field] = null;
            }
        }

        $this->replace($data);
    }
}
