<?php

namespace App\Http\Requests\Relatorios;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class RelatorioPerfilRequest extends FormRequest
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
            'data_referencia' => ['nullable', 'date'],
            'setor_id' => ['nullable', 'integer', 'exists:setores,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'data_referencia.date' => 'Informe uma data de referência válida.',
            'setor_id.exists' => 'Setor não encontrado.',
        ];
    }

    public function dataReferencia(): string
    {
        $data = $this->validated()['data_referencia'] ?? null;

        return $data ? Carbon::parse($data)->toDateString() : now()->toDateString();
    }

    public function setorId(): ?int
    {
        $setorId = $this->validated()['setor_id'] ?? null;

        return $setorId !== null ? (int) $setorId : null;
    }
}
