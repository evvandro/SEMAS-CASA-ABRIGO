<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecebimentoMaterialItem extends Model
{
    protected $table = 'recebimento_material_itens';

    protected $fillable = [
        'recebimento_material_id',
        'material_id',
        'categoria',
        'descricao',
        'quantidade',
        'unidade',
        'condicao',
        'observacoes',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'integer',
        ];
    }

    public function recebimento(): BelongsTo
    {
        return $this->belongsTo(RecebimentoMaterial::class, 'recebimento_material_id');
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
