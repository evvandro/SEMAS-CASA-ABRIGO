<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int $id
 */
class FamiliaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'responsavel_nome' => $this->responsavel_nome,
            'setor' => $this->whenLoaded('setor', fn () => new SetorResource($this->setor)),
            'acolhidos_count' => $this->when(isset($this->acolhidos_count), fn () => (int) $this->acolhidos_count),
            'data_entrada' => $this->data_entrada?->toDateString(),
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
