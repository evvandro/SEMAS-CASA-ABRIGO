<?php

namespace Tests\Feature;

use App\Models\Acolhido;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RelatoriosPerfilTest extends TestCase
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

    public function test_faixas_etarias_nas_bordas_e_recorte_na_data_referencia(): void
    {
        $this->actingAsTecnico();
        $setor = Setor::create(['nome' => 'Setor A', 'cor' => '#000000', 'capacidade' => 20, 'ativo' => true]);

        // Bordas exatas na referência 2026-07-04: completa a idade no próprio dia.
        $this->criarAcolhido($setor, ['data_nascimento' => '2014-07-05']); // 11 anos -> 0-11
        $this->criarAcolhido($setor, ['data_nascimento' => '2014-07-04']); // 12 anos -> 12-17
        $this->criarAcolhido($setor, ['data_nascimento' => '2008-07-04', 'genero' => 'feminino', 'gestante' => true]); // 18 -> 18-29
        $this->criarAcolhido($setor, ['data_nascimento' => '1966-07-04', 'idoso' => true, 'pcd' => true]); // 60 -> 60+
        $this->criarAcolhido($setor, ['data_nascimento' => null]); // sem_data

        // Fora do recorte da data de referência:
        $this->criarAcolhido($setor, ['data_nascimento' => '1990-01-01', 'data_saida' => '2026-07-01']);
        $this->criarAcolhido($setor, ['data_nascimento' => '1990-01-01', 'data_entrada' => '2026-07-10']);
        // Saiu depois da referência: ainda estava acolhido na data.
        $this->criarAcolhido($setor, ['data_nascimento' => '1996-01-01', 'data_saida' => '2026-08-01', 'cronica' => true]);

        $response = $this->getJson('/api/relatorios/perfil?data_referencia=2026-07-04')
            ->assertOk()
            ->assertJsonPath('data.total', 6)
            ->assertJsonPath('data.saude.pcd', 1)
            ->assertJsonPath('data.saude.gestante', 1)
            ->assertJsonPath('data.saude.cronica', 1)
            ->assertJsonPath('data.saude.idoso', 1);

        $faixas = collect($response->json('data.faixas_etarias'))->pluck('total', 'faixa');

        $this->assertSame(1, $faixas['0-11']);
        $this->assertSame(1, $faixas['12-17']);
        $this->assertSame(1, $faixas['18-29']);
        $this->assertSame(1, $faixas['30-59']); // nascido em 1996-01-01
        $this->assertSame(1, $faixas['60+']);
        $this->assertSame(1, $faixas['sem_data']);

        $porSetor = collect($response->json('data.por_setor'))->pluck('total', 'nome');
        $this->assertSame(6, $porSetor['Setor A']);
    }

    public function test_filtra_por_setor_e_usa_hoje_como_padrao(): void
    {
        $this->actingAsTecnico();
        $setorA = Setor::create(['nome' => 'Setor A', 'cor' => '#000000', 'capacidade' => 20, 'ativo' => true]);
        $setorB = Setor::create(['nome' => 'Setor B', 'cor' => '#111111', 'capacidade' => 20, 'ativo' => true]);

        $this->criarAcolhido($setorA, ['data_entrada' => now()->subDay()->toDateString()]);
        $this->criarAcolhido($setorB, ['data_entrada' => now()->subDay()->toDateString()]);

        $this->getJson("/api/relatorios/perfil?setor_id={$setorA->id}")
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data_referencia', now()->toDateString());
    }
}
