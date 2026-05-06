<?php

namespace App\Http\Requests\Materiais;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequest extends FormRequest
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
            'nome' => ['required', 'string', 'max:255'],
            'unidade' => ['required', 'string', 'max:30'],
            'categoria' => ['required', 'string', 'max:80'],
            'estoque_atual' => ['required', 'integer', 'min:0'],
        ];
    }
}



