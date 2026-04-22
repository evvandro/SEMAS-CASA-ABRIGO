<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Acolhido extends Model
{
    protected $table = 'acolhidos';

    protected $fillable = [
        'codigo_pulseira',
        'familia_id',
        'setor_id',
        'nome',
        'data_nascimento',
        'cpf',
        'telefone',
        'genero',
        'leito',
        'observacoes',
        'data_entrada',
        'data_saida',
        'tipo_saida',
    ];

    protected function casts(): array
    {
        return [
            'data_nascimento' => 'date',
            'data_entrada' => 'date',
            'data_saida' => 'date',
        ];
    }

    public function familia(): BelongsTo
    {
        return $this->belongsTo(Familia::class);
    }

    public function setor(): BelongsTo
    {
        return $this->belongsTo(Setor::class);
    }

    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class);
    }

    public static function gerarCodigoPulseira(): string
    {
        return DB::transaction(function () {
            $ultimo = static::lockForUpdate()->max('id') ?? 0;

            return str_pad($ultimo + 1, 4, '0', STR_PAD_LEFT);
        });
    }
}
