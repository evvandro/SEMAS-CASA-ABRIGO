<?php

namespace App\Http\Requests\Entregas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreEntregaLoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $stringFields = [
            'externo_nome',
            'externo_documento',
            'externo_contato',
            'externo_instituicao',
            'finalidade',
            'observacoes',
        ];

        $normalized = [];

        foreach ($stringFields as $field) {
            if (! $this->has($field)) {
                continue;
            }

            $value = $this->input($field);
            $normalized[$field] = is_string($value) ? trim($value) : $value;
        }

        $this->merge($normalized);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'data_entrega' => ['required', 'date'],
            'destino_tipo' => ['required', Rule::in(['acolhido', 'familia', 'externo'])],
            'familia_id' => ['nullable', 'integer', Rule::exists('familias', 'id')->whereNull('data_saida')],
            'acolhido_id' => ['nullable', 'integer', Rule::exists('acolhidos', 'id')->whereNull('data_saida')],
            'externo_nome' => ['nullable', 'string', 'max:255', 'required_if:destino_tipo,externo'],
            'externo_documento' => ['nullable', 'string', 'max:40'],
            'externo_contato' => ['nullable', 'string', 'max:80'],
            'externo_instituicao' => ['nullable', 'string', 'max:255'],
            'finalidade' => ['nullable', 'string', 'max:120'],
            'observacoes' => ['nullable', 'string'],
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.material_id' => ['required', 'integer', 'exists:materiais,id'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $destinoTipo = $this->input('destino_tipo');
                $temFamilia = filled($this->input('familia_id'));
                $temAcolhido = filled($this->input('acolhido_id'));
                $temExterno = filled($this->input('externo_nome'));

                if ($destinoTipo === 'familia' && (! $temFamilia || $temAcolhido || $temExterno)) {
                    $validator->errors()->add('destino', 'Informe somente uma família ativa como destino.');
                }

                if ($destinoTipo === 'acolhido' && (! $temAcolhido || $temFamilia || $temExterno)) {
                    $validator->errors()->add('destino', 'Informe somente uma pessoa acolhida ativa como destino.');
                }

                if ($destinoTipo === 'externo' && (! $temExterno || $temFamilia || $temAcolhido)) {
                    $validator->errors()->add('destino', 'Informe somente os dados do destinatário externo.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'destino_tipo.in' => 'O tipo de destino deve ser pessoa, família ou externo.',
            'familia_id.exists' => 'A família informada não está ativa para receber entrega.',
            'acolhido_id.exists' => 'A pessoa acolhida informada não está ativa para receber entrega.',
            'externo_nome.required_if' => 'Informe o nome do destinatário externo.',
            'itens.required' => 'Informe pelo menos um item para distribuir.',
            'itens.min' => 'Informe pelo menos um item para distribuir.',
        ];
    }
}
