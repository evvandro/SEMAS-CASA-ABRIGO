<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int $id
 */
class AcolhidoDetalheResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo_pulseira' => $this->codigo_pulseira,
            'nome' => $this->nome,
            'familia' => $this->whenLoaded('familia', function () {
                return [
                    'id' => $this->familia?->id,
                    'codigo' => $this->familia?->codigo,
                    'responsavel_nome' => $this->familia?->responsavel_nome,
                    'acolhidos_count' => $this->familia?->acolhidos_count,
                ];
            }),
            'setor' => $this->whenLoaded('setor', fn () => new SetorResource($this->setor)),
            'leito' => $this->leito,
            'parentesco' => $this->parentesco,
            'data_entrada' => $this->data_entrada?->toDateString(),
            'hora_entrada' => $this->hora_entrada ? substr((string) $this->hora_entrada, 0, 5) : null,
            'data_saida' => $this->data_saida?->toDateString(),
            'hora_saida' => $this->hora_saida ? substr((string) $this->hora_saida, 0, 5) : null,
            'tipo_saida' => $this->tipo_saida,
            'ativo' => $this->data_saida === null,
            'cpf' => $this->cpf,
            'telefone' => $this->telefone,
            'genero' => $this->genero,
            'data_nascimento' => $this->data_nascimento?->toDateString(),
            'pcd' => (bool) $this->pcd,
            'gestante' => (bool) $this->gestante,
            'cronica' => (bool) $this->cronica,
            'idoso' => (bool) $this->idoso,
            'observacoes' => $this->observacoes,
            'pertences_registrados' => $this->pertences_registrados,
            'detalhes_saida' => $this->detalhes_saida,
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
        ];
    }
}
