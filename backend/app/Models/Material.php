<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Material extends Model
{
    protected $table = 'materiais';

    protected $fillable = [
        'nome',
        'unidade',
        'categoria',
        'estoque_atual',
        'ativo',
    ];

    protected function casts(): array
    {
        return [
            'estoque_atual' => 'integer',
            'ativo' => 'boolean',
        ];
    }

    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class);
    }
}
