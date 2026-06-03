<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int $id
 */
class EntregaResource extends JsonResource
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
            'grupo_entrega' => $this->grupo_entrega,
            'material' => $this->whenLoaded('material', fn () => [
                'id' => $this->material?->id,
                'nome' => $this->material?->nome,
                'unidade' => $this->material?->unidade,
                'categoria' => $this->material?->categoria,
                'estoque_atual' => $this->material?->estoque_atual,
            ]),
            'familia' => $this->whenLoaded('familia', fn () => $this->familia === null ? null : [
                'id' => $this->familia->id,
                'codigo' => $this->familia->codigo,
                'responsavel_nome' => $this->familia->responsavel_nome,
            ]),
            'acolhido' => $this->whenLoaded('acolhido', fn () => $this->acolhido === null ? null : [
                'id' => $this->acolhido->id,
                'codigo_pulseira' => $this->acolhido->codigo_pulseira,
                'nome' => $this->acolhido->nome,
            ]),
            'destino_tipo' => $this->destino_tipo,
            'externo_nome' => $this->externo_nome,
            'externo_documento' => $this->externo_documento,
            'externo_contato' => $this->externo_contato,
            'externo_instituicao' => $this->externo_instituicao,
            'quantidade' => $this->quantidade,
            'data_entrega' => $this->data_entrega?->toDateString(),
            'finalidade' => $this->finalidade,
            'observacoes' => $this->observacoes,
            'entregue_por' => $this->whenLoaded('entreguePor', fn () => $this->entreguePor === null ? null : [
                'id' => $this->entreguePor->id,
                'name' => $this->entreguePor->name,
            ]),
        ];
    }
}
