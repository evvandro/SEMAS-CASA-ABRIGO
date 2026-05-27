<?php

namespace App\Http\Requests\Setores;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSetorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $setorId = $this->route('setor')?->id;

        return [
            'nome' => ['sometimes', 'string', 'max:60', "unique:setores,nome,{$setorId}"],
            'cor' => ['sometimes', 'string', 'max:30', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'capacidade' => ['nullable', 'integer', 'min:1', 'max:500'],
            'ativo' => ['sometimes', 'boolean'],
            'leitos_interditados' => ['sometimes', 'array'],
            'leitos_interditados.*' => ['string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.string' => 'O nome deve ser um texto.',
            'nome.max' => 'O nome não pode ter mais de 60 caracteres.',
            'nome.unique' => 'Já existe um setor com este nome.',
            'cor.string' => 'A cor deve ser um texto.',
            'cor.max' => 'A cor não pode ter mais de 30 caracteres.',
            'cor.regex' => 'A cor deve estar no formato hexadecimal (#RRGGBB).',
            'capacidade.integer' => 'A capacidade deve ser um número inteiro.',
            'capacidade.min' => 'A capacidade deve ser pelo menos 1.',
            'capacidade.max' => 'A capacidade não pode ser maior que 500.',
            'ativo.boolean' => 'O campo ativo deve ser verdadeiro ou falso.',
            'leitos_interditados.array' => 'Os leitos interditados devem ser enviados em uma lista.',
            'leitos_interditados.*.string' => 'Cada leito interditado deve ser um texto.',
            'leitos_interditados.*.max' => 'Cada leito interditado não pode ter mais de 30 caracteres.',
        ];
    }
}
