<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecebimentoMaterial extends Model
{
    protected $table = 'recebimentos_materiais';

    protected $fillable = [
        'nome_abrigo',
        'municipio_uf',
        'orgao_responsavel',
        'data_recebimento',
        'hora_recebimento',
        'origem',
        'origem_outro',
        'doador_nome',
        'doador_documento',
        'doador_contato',
        'conferido',
        'motivo_nao_conferido',
        'possui_restricao',
        'restricao_descricao',
        'destinacao_inicial',
        'local_armazenamento',
        'recebido_por',
        'funcao_equipe',
        'entregue_por',
        'observacoes_gerais',
    ];

    protected function casts(): array
    {
        return [
            'data_recebimento' => 'date',
            'conferido' => 'boolean',
            'possui_restricao' => 'boolean',
        ];
    }

    public function itens(): HasMany
    {
        return $this->hasMany(RecebimentoMaterialItem::class);
    }
}
