<?php

namespace Tests\Feature;

use App\Models\Acolhido;
use App\Models\Familia;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FamiliasApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_tecnico_can_create_familia(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $setor = Setor::create(['nome' => 'Teste', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);

        $response = $this->postJson('/api/familias', [
            'responsavel_nome' => 'Responsável',
            'setor_id' => $setor->id,
            'observacoes' => 'Obs',
            'data_entrada' => now()->toDateString(),
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure(['message', 'data' => ['id', 'codigo', 'setor']]);

        $this->assertDatabaseHas('familias', [
            'id' => $response->json('data.id'),
            'setor_id' => $setor->id,
        ]);
    }

    public function test_can_create_familia_with_members_and_fetch_detail(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $setor = Setor::create(['nome' => 'Familias', 'cor' => '#123456', 'capacidade' => 10, 'ativo' => true]);

        $response = $this->postJson('/api/familias', [
            'responsavel_nome' => 'Ana Responsavel',
            'setor_id' => $setor->id,
            'data_entrada' => now()->toDateString(),
            'acolhidos' => [
                [
                    'nome' => 'Ana Responsavel',
                    'cpf' => null,
                    'parentesco' => 'Responsavel',
                    'leito' => 'F1',
                ],
                [
                    'nome' => 'Criança Silva',
                    'cpf' => '12345678901',
                    'parentesco' => 'Filho',
                    'leito' => 'F2',
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.responsavel_nome', 'Ana Responsavel')
            ->assertJsonPath('data.acolhidos_count', 2);

        $familiaId = $response->json('data.id');

        $this->assertDatabaseCount('familias', 1);
        $this->assertDatabaseHas('acolhidos', [
            'familia_id' => $familiaId,
            'nome' => 'Criança Silva',
            'parentesco' => 'Filho',
        ]);

        $this->getJson("/api/familias/{$familiaId}")
            ->assertOk()
            ->assertJsonPath('data.acolhidos_count', 2)
            ->assertJsonCount(2, 'data.acolhidos');
    }

    public function test_familia_member_cpf_validation_allows_absent_and_rejects_invalid(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $setor = Setor::create(['nome' => 'CPF Familia', 'cor' => '#654321', 'capacidade' => 10, 'ativo' => true]);

        $this->postJson('/api/familias', [
            'responsavel_nome' => 'Resp',
            'setor_id' => $setor->id,
            'data_entrada' => now()->toDateString(),
            'acolhidos' => [
                ['nome' => 'Pessoa Um', 'cpf' => '123'],
                ['nome' => 'Pessoa Dois'],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('acolhidos.0.cpf');
    }

    public function test_saida_updates_data_saida_without_deleting(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $setor = Setor::create(['nome' => 'Teste', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
        $familia = Familia::create([
            'codigo' => Familia::gerarCodigo(),
            'responsavel_nome' => 'Resp',
            'setor_id' => $setor->id,
            'observacoes' => 'Obs',
            'data_entrada' => now()->toDateString(),
            'data_saida' => null,
            'tipo_saida' => null,
        ]);

        $this->postJson("/api/familias/{$familia->id}/saida", [
            'data_saida' => now()->toDateString(),
            'tipo_saida' => 'alta',
        ])
            ->assertOk()
            ->assertJsonPath('data.ativo', false);

        $familia->refresh();

        $this->assertNotNull($familia->data_saida);
        $this->assertSame(now()->toDateString(), $familia->data_saida->toDateString());
    }

    public function test_individual_saida_keeps_family_active_when_other_members_remain(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $setor = Setor::create(['nome' => 'Saida parcial', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
        $familia = Familia::create([
            'codigo' => Familia::gerarCodigo(),
            'responsavel_nome' => 'Resp',
            'setor_id' => $setor->id,
            'data_entrada' => now()->toDateString(),
        ]);
        $membroUm = Acolhido::create([
            'codigo_pulseira' => Acolhido::gerarCodigoPulseira(),
            'familia_id' => $familia->id,
            'setor_id' => $setor->id,
            'nome' => 'Membro Um',
            'data_entrada' => now()->toDateString(),
        ]);
        $membroDois = Acolhido::create([
            'codigo_pulseira' => Acolhido::gerarCodigoPulseira(),
            'familia_id' => $familia->id,
            'setor_id' => $setor->id,
            'nome' => 'Membro Dois',
            'data_entrada' => now()->toDateString(),
        ]);

        $this->postJson("/api/acolhidos/{$membroUm->id}/saida", [
            'data_saida' => now()->toDateString(),
            'tipo_saida' => 'alta',
        ])->assertOk();

        $familia->refresh();
        $membroDois->refresh();

        $this->assertNull($familia->data_saida);
        $this->assertNull($membroDois->data_saida);
    }

    public function test_individual_saida_of_last_member_closes_family(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $setor = Setor::create(['nome' => 'Ultimo membro', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
        $familia = Familia::create([
            'codigo' => Familia::gerarCodigo(),
            'responsavel_nome' => 'Resp',
            'setor_id' => $setor->id,
            'data_entrada' => now()->toDateString(),
        ]);
        $membro = Acolhido::create([
            'codigo_pulseira' => Acolhido::gerarCodigoPulseira(),
            'familia_id' => $familia->id,
            'setor_id' => $setor->id,
            'nome' => 'Membro Unico',
            'data_entrada' => now()->toDateString(),
        ]);

        $this->postJson("/api/acolhidos/{$membro->id}/saida", [
            'data_saida' => now()->toDateString(),
            'tipo_saida' => 'alta',
            'destino_informado' => 'Residencia',
        ])->assertOk();

        $familia->refresh();

        $this->assertNotNull($familia->data_saida);
        $this->assertSame('alta', $familia->tipo_saida);
        $this->assertSame('Residencia', $familia->destino_informado);
    }

    public function test_family_saida_closes_all_active_members(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $setor = Setor::create(['nome' => 'Saida familia', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
        $familia = Familia::create([
            'codigo' => Familia::gerarCodigo(),
            'responsavel_nome' => 'Resp',
            'setor_id' => $setor->id,
            'data_entrada' => now()->toDateString(),
        ]);
        $membros = collect(['Um', 'Dois'])->map(fn ($nome) => Acolhido::create([
            'codigo_pulseira' => Acolhido::gerarCodigoPulseira(),
            'familia_id' => $familia->id,
            'setor_id' => $setor->id,
            'nome' => "Membro {$nome}",
            'data_entrada' => now()->toDateString(),
        ]));

        $this->postJson("/api/familias/{$familia->id}/saida", [
            'data_saida' => now()->toDateString(),
            'tipo_saida' => 'alta coletiva',
            'condicao_saida' => 'Regularizada',
        ])
            ->assertOk()
            ->assertJsonPath('data.ativo', false);

        foreach ($membros as $membro) {
            $membro->refresh();
            $this->assertNotNull($membro->data_saida);
            $this->assertSame('alta coletiva', $membro->tipo_saida);
            $this->assertSame('Regularizada', $membro->condicao_saida);
        }
    }
}
