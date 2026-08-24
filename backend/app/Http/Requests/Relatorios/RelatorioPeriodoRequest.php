<?php

namespace App\Http\Requests\Relatorios;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RelatorioPeriodoRequest extends FormRequest
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
            'de' => ['required', 'date'],
            'ate' => ['required', 'date', 'after_or_equal:de'],
            'setor_id' => ['nullable', 'integer', 'exists:setores,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $de = Carbon::parse($this->input('de'));
            $ate = Carbon::parse($this->input('ate'));

            if ($de->diffInDays($ate) > 366) {
                $validator->errors()->add('ate', 'O período máximo do relatório é de 366 dias.');
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'de.required' => 'Informe a data inicial do período.',
            'de.date' => 'Informe uma data inicial válida.',
            'ate.required' => 'Informe a data final do período.',
            'ate.date' => 'Informe uma data final válida.',
            'ate.after_or_equal' => 'A data final deve ser igual ou posterior à data inicial.',
            'setor_id.exists' => 'Setor não encontrado.',
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    public function periodo(): array
    {
        $validated = $this->validated();

        return [
            Carbon::parse($validated['de'])->toDateString(),
            Carbon::parse($validated['ate'])->toDateString(),
        ];
    }

    public function setorId(): ?int
    {
        $setorId = $this->validated()['setor_id'] ?? null;

        return $setorId !== null ? (int) $setorId : null;
    }
}
