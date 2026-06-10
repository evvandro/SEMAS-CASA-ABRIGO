<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int $id
 */
class FamiliaDetalheResource extends JsonResource
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
            'acolhidos' => $this->whenLoaded('acolhidos', fn () => AcolhidoResource::collection($this->acolhidos)),
            'observacoes' => $this->observacoes,
            'data_entrada' => $this->data_entrada?->toDateString(),
            'hora_entrada' => $this->hora_entrada,
            'data_saida' => $this->data_saida?->toDateString(),
            'hora_saida' => $this->hora_saida,
            'tipo_saida' => $this->tipo_saida,
            'destino_informado' => $this->destino_informado,
            'endereco_destino' => $this->endereco_destino,
            'municipio_destino' => $this->municipio_destino,
            'telefone_destino' => $this->telefone_destino,
            'encaminhamentos_rede' => $this->encaminhamentos_rede,
            'resumo_encaminhamento' => $this->resumo_encaminhamento,
            'condicao_saida' => $this->condicao_saida,
            'observacoes_tecnicas' => $this->observacoes_tecnicas,
            'responsavel_desligamento' => $this->responsavel_desligamento,
            'cargo_responsavel' => $this->cargo_responsavel,
            'ativo' => $this->data_saida === null,
        ];
    }
}
