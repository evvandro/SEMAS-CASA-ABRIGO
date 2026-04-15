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
    ];

    protected function casts(): array
    {
        return [
            'data_entrada' => 'date',
            'data_saida'   => 'date',
        ];
    }

    public function setor(): BelongsTo
    {
        return $this->belongsTo(Setor::class);
    }

    // Dev 2 adicionará: public function acolhidos(): HasMany

    public static function gerarCodigo(): string
    {
        return DB::transaction(function () {
            $ultimo = static::lockForUpdate()->max('id') ?? 0;

            return 'FAM-' . str_pad($ultimo + 1, 4, '0', STR_PAD_LEFT);
        });
    }
}
