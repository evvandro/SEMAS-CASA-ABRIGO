<?php

namespace Tests\Feature;

use App\Models\Acolhido;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RelatoriosOcupacaoTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsTecnico(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
    }

    private function criarAcolhido(Setor $setor, array $atributos = []): Acolhido
    {
        return Acolhido::create(array_merge([
            'codigo_pulseira' => Acolhido::gerarCodigoPulseira(),
            'setor_id' => $setor->id,
            'nome' => 'Acolhido Teste',
            'data_entrada' => '2026-06-01',
        ], $atributos));
    }

    public function test_running_total_considera_quem_entrou_antes_do_periodo(): void
    {
        $this->actingAsTecnico();
        $setor = Setor::create([
            'nome' => 'Setor A',
            'cor' => '#000000',
            'capacidade' => 10,
            'ativo' => true,
            'leitos_interditados' => ['A1'],
        ]);

        // Entrou antes do período e saiu no meio dele: conta no estoque inicial.
        $this->criarAcolhido($setor, ['data_entrada' => '2026-05-20', 'data_saida' => '2026-06-03']);
        // Entrou durante o período e segue ativo.
        $this->criarAcolhido($setor, ['data_entrada' => '2026-06-02']);

        $response = $this->getJson('/api/relatorios/ocupacao?de=2026-06-01&ate=2026-06-05')
            ->assertOk()
            ->assertJsonPath('data.agregacao', 'dia')
            ->assertJsonPath('data.capacidade_disponivel', 9)
            ->assertJsonPath('data.atual.0.ocupados', 1)
            ->assertJsonPath('data.atual.0.leitos_interditados', 1)
            ->assertJsonPath('data.atual.0.capacidade', 10);

        $historico = collect($response->json('data.historico'))->pluck('ocupados', 'dia');

        $this->assertSame(1, $historico['2026-06-01']);
        $this->assertSame(2, $historico['2026-06-02']);
        $this->assertSame(1, $historico['2026-06-03']);
        $this->assertSame(1, $historico['2026-06-05']);
    }

    public function test_reamostra_por_semana_em_periodos_longos(): void
    {
        $this->actingAsTecnico();
        Setor::create(['nome' => 'Setor A', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);

        $response = $this->getJson('/api/relatorios/ocupacao?de=2026-01-01&ate=2026-05-01')
            ->assertOk()
            ->assertJsonPath('data.agregacao', 'semana');

        $this->assertLessThan(30, count($response->json('data.historico')));
    }

    public function test_filtra_por_setor(): void
    {
        $this->actingAsTecnico();
        $setorA = Setor::create(['nome' => 'Setor A', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
        $setorB = Setor::create(['nome' => 'Setor B', 'cor' => '#111111', 'capacidade' => 5, 'ativo' => true]);

        $this->criarAcolhido($setorA, ['data_entrada' => '2026-06-02']);
        $this->criarAcolhido($setorB, ['data_entrada' => '2026-06-02']);

        $response = $this->getJson("/api/relatorios/ocupacao?de=2026-06-01&ate=2026-06-05&setor_id={$setorB->id}")
            ->assertOk()
            ->assertJsonPath('data.capacidade_disponivel', 5)
            ->assertJsonCount(1, 'data.atual');

        $historico = collect($response->json('data.historico'))->pluck('ocupados', 'dia');
        $this->assertSame(1, $historico['2026-06-05']);
    }
}
