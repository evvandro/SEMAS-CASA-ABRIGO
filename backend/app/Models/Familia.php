<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Familia extends Model
{
    protected $table = 'familias';

    protected $fillable = [
        'codigo',
        'responsavel_nome',
        'setor_id',
        'observacoes',
        'data_entrada',
        'data_saida',
        'tipo_saida',
        'hora_saida',
        'destino_informado',
        'endereco_destino',
        'municipio_destino',
        'telefone_destino',
        'encaminhamentos_rede',
        'resumo_encaminhamento',
        'condicao_saida',
        'observacoes_tecnicas',
        'responsavel_desligamento',
        'cargo_responsavel',
    ];

    protected function casts(): array
    {
        return [
            'data_entrada' => 'date',
            'data_saida' => 'date',
            'encaminhamentos_rede' => 'array',
        ];
    }

    public function setor(): BelongsTo
    {
        return $this->belongsTo(Setor::class);
    }

    public function acolhidos(): HasMany
    {
        return $this->hasMany(Acolhido::class);
    }

    public static function gerarCodigo(): string
    {
        return DB::transaction(function () {
            $ultimo = static::lockForUpdate()->max('id') ?? 0;

            return 'FAM-'.str_pad($ultimo + 1, 4, '0', STR_PAD_LEFT);
        });
    }
}
