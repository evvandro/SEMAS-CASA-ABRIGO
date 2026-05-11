<?php

namespace App\Http\Requests\Setores;

use Illuminate\Foundation\Http\FormRequest;

class StoreSetorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:60', 'unique:setores,nome'],
            'cor' => ['required', 'string', 'max:30', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'capacidade' => ['nullable', 'integer', 'min:1', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required' => 'O nome é obrigatório.',
            'nome.string' => 'O nome deve ser um texto.',
            'nome.max' => 'O nome não pode ter mais de 60 caracteres.',
            'nome.unique' => 'Já existe um setor com este nome.',
            'cor.required' => 'A cor é obrigatória.',
            'cor.string' => 'A cor deve ser um texto.',
            'cor.max' => 'A cor não pode ter mais de 30 caracteres.',
            'cor.regex' => 'A cor deve estar no formato hexadecimal (#RRGGBB).',
            'capacidade.integer' => 'A capacidade deve ser um número inteiro.',
            'capacidade.min' => 'A capacidade deve ser pelo menos 1.',
            'capacidade.max' => 'A capacidade não pode ser maior que 500.',
        ];
    }
}
