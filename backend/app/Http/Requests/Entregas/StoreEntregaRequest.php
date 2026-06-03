<?php

namespace App\Http\Requests\Entregas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'familia_id' => ['nullable', 'integer', Rule::exists('familias', 'id')->whereNull('data_saida'), 'required_without:acolhido_id'],
            'acolhido_id' => ['nullable', 'integer', Rule::exists('acolhidos', 'id')->whereNull('data_saida'), 'required_without:familia_id'],
            'quantidade' => ['required', 'integer', 'min:1'],
            'data_entrega' => ['required', 'date'],
            'finalidade' => ['nullable', 'string', 'max:120'],
            'observacoes' => ['nullable', 'string'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $destinos = collect(['familia_id', 'acolhido_id'])
                    ->filter(fn (string $field): bool => filled($this->input($field)))
                    ->count();

                if ($destinos !== 1) {
                    $validator->errors()->add('destino', 'Informe exatamente uma família ou uma pessoa acolhida para registrar a entrega.');
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
            'familia_id.required_without' => 'Informe uma família ou um acolhido para registrar a entrega.',
            'acolhido_id.required_without' => 'Informe uma família ou um acolhido para registrar a entrega.',
            'familia_id.exists' => 'A família informada não está ativa para receber entrega.',
            'acolhido_id.exists' => 'A pessoa acolhida informada não está ativa para receber entrega.',
        ];
    }
}
