<?php

namespace App\Http\Requests\Familias;

use App\Models\Familia;
use Illuminate\Foundation\Http\FormRequest;

class StoreFamiliaRequest extends FormRequest
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
            'responsavel_nome' => ['required', 'string', 'max:255'],
            'setor_id' => ['required', 'integer', 'exists:setores,id'],
            'observacoes' => ['nullable', 'string'],
            'data_entrada' => ['required', 'date'],
            'acolhidos' => ['nullable', 'array', 'min:2'],
            'acolhidos.*.nome' => ['required_with:acolhidos', 'string', 'max:255'],
            'acolhidos.*.cpf' => ['nullable', 'regex:/^\d{11}$/'],
            'acolhidos.*.data_nascimento' => ['nullable', 'date'],
            'acolhidos.*.parentesco' => ['nullable', 'string', 'max:100'],
            'acolhidos.*.telefone' => ['nullable', 'string', 'max:20'],
            'acolhidos.*.genero' => ['nullable', 'string', 'max:30'],
            'acolhidos.*.leito' => ['nullable', 'string', 'max:30'],
            'acolhidos.*.observacoes' => ['nullable', 'string'],
            'acolhidos.*.pertences_registrados' => ['nullable', 'string'],
            'acolhidos.*.pcd' => ['nullable', 'boolean'],
            'acolhidos.*.gestante' => ['nullable', 'boolean'],
            'acolhidos.*.cronica' => ['nullable', 'boolean'],
            'acolhidos.*.idoso' => ['nullable', 'boolean'],
            'acolhidos.*.hora_entrada' => ['nullable', 'date_format:H:i:s,H:i'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! is_array($this->input('acolhidos'))) {
            return;
        }

        $acolhidos = collect($this->input('acolhidos'))
            ->map(function ($acolhido) {
                if (! is_array($acolhido) || ! array_key_exists('cpf', $acolhido)) {
                    return $acolhido;
                }

                $digits = preg_replace('/\D+/', '', (string) $acolhido['cpf']);
                $acolhido['cpf'] = $digits ?: null;

                return $acolhido;
            })
            ->all();

        $this->merge(['acolhidos' => $acolhidos]);
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        $data['codigo'] = Familia::gerarCodigo();
        $data['data_saida'] = null;
        $data['tipo_saida'] = null;

        return $data;
    }
}
