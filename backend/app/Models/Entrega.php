<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Entrega extends Model
{
    protected $table = 'entregas';

    protected $fillable = [
        'material_id',
        'familia_id',
        'acolhido_id',
        'quantidade',
        'data_entrega',
        'observacoes',
        'entregue_por',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'integer',
            'data_entrega' => 'date',
        ];
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function familia(): BelongsTo
    {
        return $this->belongsTo(Familia::class);
    }

    public function acolhido(): BelongsTo
    {
        return $this->belongsTo(Acolhido::class);
    }

    public function entreguePor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entregue_por');
    }
}
