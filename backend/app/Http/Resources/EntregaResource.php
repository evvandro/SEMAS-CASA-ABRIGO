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
            'material_id' => $this->material_id,
            'familia_id' => $this->familia_id,
            'acolhido_id' => $this->acolhido_id,
            'quantidade' => $this->quantidade,
            'data_entrega' => $this->data_entrega,
            'observacoes' => $this->observacoes,
            'entregue_por' => $this->entregue_por,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
