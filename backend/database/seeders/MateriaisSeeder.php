<?php

namespace Database\Seeders;

use App\Models\Material;
use Illuminate\Database\Seeder;

class MateriaisSeeder extends Seeder
{
    public function run(): void
    {
        $materiais = [
            ['nome' => 'Kit Higiene',        'unidade' => 'kit',     'categoria' => 'Higiene'],
            ['nome' => 'Kit Lanche',         'unidade' => 'kit',     'categoria' => 'Alimentação'],
            ['nome' => 'Cobertor',           'unidade' => 'unidade', 'categoria' => 'Abrigo'],
            ['nome' => 'Cesta Básica',       'unidade' => 'cesta',   'categoria' => 'Alimentação'],
            ['nome' => 'Água Mineral 500ml', 'unidade' => 'garrafa', 'categoria' => 'Alimentação'],
            ['nome' => 'Colchão',            'unidade' => 'unidade', 'categoria' => 'Abrigo'],
            ['nome' => 'Fralda Descartável', 'unidade' => 'pacote',  'categoria' => 'Higiene'],
            ['nome' => 'Toalha',             'unidade' => 'unidade', 'categoria' => 'Higiene'],
        ];

        foreach ($materiais as $material) {
            Material::firstOrCreate(['nome' => $material['nome']], $material);
        }
    }
}
