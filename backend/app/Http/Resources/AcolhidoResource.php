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
            'familia_id' => $this->familia_id,
            'setor_id' => $this->setor_id,
            'nome' => $this->nome,
            'data_nascimento' => $this->data_nascimento,
            'cpf' => $this->cpf,
            'telefone' => $this->telefone,
            'genero' => $this->genero,
            'leito' => $this->leito,
            'observacoes' => $this->observacoes,
            'data_entrada' => $this->data_entrada,
            'data_saida' => $this->data_saida,
            'tipo_saida' => $this->tipo_saida,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
