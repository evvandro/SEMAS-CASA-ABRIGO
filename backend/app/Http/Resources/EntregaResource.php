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
            'material' => $this->whenLoaded('material', fn () => [
                'id' => $this->material?->id,
                'nome' => $this->material?->nome,
                'unidade' => $this->material?->unidade,
                'categoria' => $this->material?->categoria,
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
            'quantidade' => $this->quantidade,
            'data_entrega' => $this->data_entrega?->toDateString(),
            'observacoes' => $this->observacoes,
        ];
    }
}
