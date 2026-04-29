<?php

namespace Tests\Feature;

use App\Models\Familia;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AcolhidosApiTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_can_crud_acolhido(): void
    {
        $this->actingAsUser();

        $setor = Setor::create(['nome' => 'Teste', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
        $familia = Familia::create([
            'codigo' => Familia::gerarCodigo(),
            'responsavel_nome' => 'Resp',
            'setor_id' => $setor->id,
            'observacoes' => null,
            'data_entrada' => now()->toDateString(),
            'data_saida' => null,
            'tipo_saida' => null,
        ]);

        $create = $this->postJson('/api/acolhidos', [
            'familia_id' => $familia->id,
            'setor_id' => $setor->id,
            'nome' => 'João da Silva',
            'data_nascimento' => '1990-01-01',
            'cpf' => '12345678901',
            'telefone' => '47999999999',
            'genero' => 'masculino',
            'leito' => 'A1',
            'observacoes' => 'Obs',
            'data_entrada' => now()->toDateString(),
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.nome', 'João da Silva')
            ->assertJsonStructure(['message', 'data' => ['id', 'codigo_pulseira']]);

        $acolhidoId = $create->json('data.id');

        $this->getJson('/api/acolhidos')
            ->assertOk()
            ->assertJsonStructure(['message', 'data']);

        $this->getJson("/api/acolhidos/{$acolhidoId}")
            ->assertOk()
            ->assertJsonPath('data.id', $acolhidoId);

        $this->patchJson("/api/acolhidos/{$acolhidoId}", ['telefone' => '47999999999'])
            ->assertOk()
            ->assertJsonPath('data.telefone', '47999999999');

        $this->postJson("/api/acolhidos/{$acolhidoId}/saida", [
            'data_saida' => now()->toDateString(),
            'tipo_saida' => 'alta',
        ])
            ->assertOk()
            ->assertJsonPath('data.ativo', false);

        $this->assertDatabaseHas('acolhidos', ['id' => $acolhidoId]);
    }

    public function test_create_requires_nome_and_data_entrada(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/acolhidos', [])
            ->assertUnprocessable();
    }

    public function test_unauthenticated_cannot_access_acolhidos(): void
    {
        $this->getJson('/api/acolhidos')->assertUnauthorized();
    }
}
