<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int $id
 */
class AcolhidoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo_pulseira' => $this->codigo_pulseira,
            'nome' => $this->nome,
            'cpf' => $this->cpf,
            'data_nascimento' => $this->data_nascimento?->toDateString(),
            'leito' => $this->leito,
            'pcd' => (bool) $this->pcd,
            'gestante' => (bool) $this->gestante,
            'cronica' => (bool) $this->cronica,
            'idoso' => (bool) $this->idoso,
            'familia' => $this->whenLoaded('familia', function () {
                return [
                    'id' => $this->familia?->id,
                    'codigo' => $this->familia?->codigo,
                    'responsavel_nome' => $this->familia?->responsavel_nome,
                ];
            }),
            'setor' => $this->whenLoaded('setor', fn () => new SetorResource($this->setor)),
            'data_entrada' => $this->data_entrada?->toDateString(),
            'data_saida' => $this->data_saida?->toDateString(),
            'ativo' => $this->data_saida === null,
        ];
    }
}

