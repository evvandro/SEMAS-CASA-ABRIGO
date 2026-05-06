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

        $data['codigo'] = Familia::gerarCodigo();
        $data['data_saida'] = null;
        $data['tipo_saida'] = null;

        return $data;
    }
}
