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
                ];
            }),
            'setor' => $this->whenLoaded('setor', fn () => new SetorResource($this->setor)),
            'leito' => $this->leito,
            'data_entrada' => $this->data_entrada?->toDateString(),
            'data_saida' => $this->data_saida?->toDateString(),
            'ativo' => $this->data_saida === null,
            'cpf' => $this->cpf,
            'telefone' => $this->telefone,
            'genero' => $this->genero,
            'data_nascimento' => $this->data_nascimento?->toDateString(),
            'observacoes' => $this->observacoes,
        ];
    }
}
