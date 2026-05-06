<?php

namespace Tests\Feature;

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
}
