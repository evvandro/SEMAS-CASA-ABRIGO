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
            'telefone' => $this->telefone,
            'genero' => $this->genero,
            'leito' => $this->leito,
            'parentesco' => $this->parentesco,
            'pcd' => (bool) $this->pcd,
            'gestante' => (bool) $this->gestante,
            'cronica' => (bool) $this->cronica,
            'idoso' => (bool) $this->idoso,
            'observacoes' => $this->observacoes,
            'pertences_registrados' => $this->pertences_registrados,
            'familia' => $this->whenLoaded('familia', function () {
                return [
                    'id' => $this->familia?->id,
                    'codigo' => $this->familia?->codigo,
                    'responsavel_nome' => $this->familia?->responsavel_nome,
                    'acolhidos_count' => $this->familia?->acolhidos_count,
                ];
            }),
            'setor' => $this->whenLoaded('setor', fn () => new SetorResource($this->setor)),
            'data_entrada' => $this->data_entrada?->toDateString(),
            'hora_entrada' => $this->hora_entrada ? substr((string) $this->hora_entrada, 0, 5) : null,
            'data_saida' => $this->data_saida?->toDateString(),
            'hora_saida' => $this->hora_saida ? substr((string) $this->hora_saida, 0, 5) : null,
            'tipo_saida' => $this->tipo_saida,
            'destino_informado' => $this->destino_informado,
            'municipio_destino' => $this->municipio_destino,
            'condicao_saida' => $this->condicao_saida,
            'responsavel_desligamento' => $this->responsavel_desligamento,
            'ativo' => $this->data_saida === null,
        ];
    }
}
