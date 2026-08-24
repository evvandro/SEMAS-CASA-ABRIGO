<?php

namespace Tests\Feature;

use App\Models\Acolhido;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RelatoriosAcolhimentosTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsTecnico(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
    }

    private function criarSetor(string $nome = 'Setor A'): Setor
    {
        return Setor::create(['nome' => $nome, 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
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

    public function test_gera_totais_serie_permanencia_motivos_e_encaminhamentos(): void
    {
        $this->actingAsTecnico();
        $setor = $this->criarSetor();

        $this->criarAcolhido($setor, ['data_entrada' => '2026-06-01']);
        $this->criarAcolhido($setor, ['data_entrada' => '2026-06-03']);
        $this->criarAcolhido($setor, ['data_entrada' => '2026-05-01']);
        $this->criarAcolhido($setor, [
            'data_entrada' => '2026-05-20',
            'data_saida' => '2026-06-03',
            'tipo_saida' => 'alta',
            'condicao_saida' => 'estavel',
            'encaminhamentos_rede' => ['CRAS', 'CAPS'],
        ]);

        $response = $this->getJson('/api/relatorios/acolhimentos?de=2026-06-01&ate=2026-06-05')
            ->assertOk()
            ->assertJsonPath('data.totais.entradas', 2)
            ->assertJsonPath('data.totais.saidas', 1)
            ->assertJsonPath('data.permanencia.media_dias', 14)
            ->assertJsonPath('data.permanencia.minimo_dias', 14)
            ->assertJsonPath('data.permanencia.maximo_dias', 14)
            ->assertJsonPath('data.motivos_saida.0.motivo', 'alta')
            ->assertJsonPath('data.motivos_saida.0.total', 1)
            ->assertJsonPath('data.condicoes_saida.0.condicao', 'estavel');

        $serie = collect($response->json('data.serie'))->keyBy('dia');

        $this->assertCount(5, $serie);
        $this->assertSame(1, $serie['2026-06-01']['entradas']);
        $this->assertSame(1, $serie['2026-06-03']['entradas']);
        $this->assertSame(1, $serie['2026-06-03']['saidas']);
        $this->assertSame(0, $serie['2026-06-05']['entradas']);

        $encaminhamentos = collect($response->json('data.encaminhamentos'))->pluck('total', 'encaminhamento');
        $this->assertSame(1, $encaminhamentos['CRAS']);
        $this->assertSame(1, $encaminhamentos['CAPS']);
    }

    public function test_filtra_por_setor(): void
    {
        $this->actingAsTecnico();
        $setorA = $this->criarSetor('Setor A');
        $setorB = $this->criarSetor('Setor B');

        $this->criarAcolhido($setorA, ['data_entrada' => '2026-06-02']);
        $this->criarAcolhido($setorB, ['data_entrada' => '2026-06-02']);

        $this->getJson("/api/relatorios/acolhimentos?de=2026-06-01&ate=2026-06-05&setor_id={$setorA->id}")
            ->assertOk()
            ->assertJsonPath('data.totais.entradas', 1);
    }

    public function test_rejeita_periodo_invertido_e_maior_que_um_ano(): void
    {
        $this->actingAsTecnico();

        $this->getJson('/api/relatorios/acolhimentos?de=2026-06-05&ate=2026-06-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ate');

        $this->getJson('/api/relatorios/acolhimentos?de=2025-01-01&ate=2026-02-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ate');
    }

    public function test_role_logistica_recebe_403(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'logistica']));

        $this->getJson('/api/relatorios/acolhimentos?de=2026-06-01&ate=2026-06-05')
            ->assertForbidden();
    }

    public function test_nao_autenticado_recebe_401(): void
    {
        $this->getJson('/api/relatorios/acolhimentos?de=2026-06-01&ate=2026-06-05')
            ->assertUnauthorized();
    }
}
