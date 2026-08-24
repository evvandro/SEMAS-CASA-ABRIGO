<?php

namespace Tests\Feature;

use App\Models\Entrega;
use App\Models\Material;
use App\Models\RecebimentoMaterial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RelatoriosEstoqueTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsTecnico(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
    }

    private function criarRecebimento(string $data, string $origem = 'doacao'): RecebimentoMaterial
    {
        return RecebimentoMaterial::create([
            'nome_abrigo' => 'Casa Abrigo',
            'municipio_uf' => 'Belém/PA',
            'orgao_responsavel' => 'SEMAS',
            'data_recebimento' => $data,
            'hora_recebimento' => '10:00',
            'origem' => $origem,
            'doador_nome' => 'Doador Teste',
            'conferido' => true,
            'possui_restricao' => false,
            'destinacao_inicial' => 'estoque',
            'recebido_por' => 'Equipe',
        ]);
    }

    public function test_agrega_recebimentos_entregas_e_saldo(): void
    {
        $this->actingAsTecnico();

        $material = Material::create(['nome' => 'Colchao', 'unidade' => 'unidade', 'estoque_atual' => 5, 'ativo' => true]);

        $recebimento = $this->criarRecebimento('2026-06-02');
        $recebimento->itens()->create([
            'material_id' => $material->id,
            'categoria' => 'Higiene',
            'descricao' => 'Colchao solteiro',
            'quantidade' => 10,
            'unidade' => 'unidade',
            'condicao' => 'novo',
        ]);

        $foraDoPeriodo = $this->criarRecebimento('2026-05-01');
        $foraDoPeriodo->itens()->create([
            'material_id' => $material->id,
            'categoria' => 'Higiene',
            'descricao' => 'Colchao solteiro',
            'quantidade' => 99,
            'unidade' => 'unidade',
            'condicao' => 'novo',
        ]);

        Entrega::create([
            'material_id' => $material->id,
            'quantidade' => 3,
            'data_entrega' => '2026-06-03',
            'destino_tipo' => 'familia',
        ]);
        Entrega::create([
            'material_id' => $material->id,
            'quantidade' => 2,
            'data_entrega' => '2026-06-04',
        ]);

        $response = $this->getJson('/api/relatorios/estoque?de=2026-06-01&ate=2026-06-05')
            ->assertOk()
            ->assertJsonPath('data.totais.itens_recebidos', 10)
            ->assertJsonPath('data.totais.itens_entregues', 5)
            ->assertJsonPath('data.recebidos_por_material.0.nome', 'Colchao')
            ->assertJsonPath('data.recebidos_por_material.0.total', 10)
            ->assertJsonPath('data.recebimentos_por_origem.0.origem', 'doacao')
            ->assertJsonPath('data.recebimentos_por_origem.0.recebimentos', 1)
            ->assertJsonPath('data.entregas_por_material.0.total', 5)
            ->assertJsonPath('data.saldo_atual.0.nome', 'Colchao')
            ->assertJsonPath('data.saldo_atual.0.estoque_atual', 5);

        $porDestino = collect($response->json('data.entregas_por_destino'))->pluck('itens', 'destino');
        $this->assertSame(3, $porDestino['familia']);
        $this->assertSame(2, $porDestino['nao_informado']);

        $serie = collect($response->json('data.serie'))->keyBy('dia');
        $this->assertSame(10, $serie['2026-06-02']['recebidos']);
        $this->assertSame(3, $serie['2026-06-03']['entregues']);
        $this->assertSame(2, $serie['2026-06-04']['entregues']);
    }
}
