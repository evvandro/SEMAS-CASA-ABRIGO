<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Setor extends Model
{
    protected $table = 'setores';

    protected $fillable = ['nome', 'cor', 'capacidade', 'ativo'];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
        ];
    }

    public function familias(): HasMany
    {
        return $this->hasMany(Familia::class);
    }

    // Dev 2 adicionará: public function acolhidos(): HasMany
}
