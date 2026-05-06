<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int $id
 */
class MaterialResource extends JsonResource
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
            'nome' => $this->nome,
            'unidade' => $this->unidade,
            'categoria' => $this->categoria,
            'estoque_atual' => $this->estoque_atual,
            'ativo' => $this->ativo,
        ];
    }
}
