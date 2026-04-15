<?php

namespace Database\Seeders;

use App\Models\Setor;
use Illuminate\Database\Seeder;

class SetoresSeeder extends Seeder
{
    public function run(): void
    {
        $setores = [
            ['nome' => 'Verde',   'cor' => '#2e7d32'],
            ['nome' => 'Azul',    'cor' => '#1565c0'],
            ['nome' => 'Rosa',    'cor' => '#c2185b'],
            ['nome' => 'Amarelo', 'cor' => '#f9a825'],
        ];

        foreach ($setores as $setor) {
            Setor::firstOrCreate(['nome' => $setor['nome']], $setor);
        }
    }
}
