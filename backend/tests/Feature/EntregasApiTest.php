<?php

namespace Tests\Feature;

use App\Models\Acolhido;
use App\Models\Familia;
use App\Models\Material;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EntregasApiTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_cannot_create_entrega_without_familia_or_acolhido(): void
    {
        $this->actingAsUser();

        $material = Material::create(['nome' => 'Kit', 'unidade' => 'kit', 'categoria' => 'Teste', 'estoque_atual' => 0, 'ativo' => true]);

        $this->postJson('/api/entregas', [
            'material_id' => $material->id,
            'quantidade' => 1,
            'data_entrega' => now()->toDateString(),
        ])->assertUnprocessable();
    }

    public function test_can_crud_entrega(): void
    {
        $user = $this->actingAsUser();

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

        $acolhido = Acolhido::create([
            'codigo_pulseira' => Acolhido::gerarCodigoPulseira(),
            'familia_id' => $familia->id,
            'setor_id' => $setor->id,
            'nome' => 'Pessoa',
            'data_entrada' => now()->toDateString(),
        ]);

        $material = Material::create(['nome' => 'Kit', 'unidade' => 'kit', 'categoria' => 'Teste', 'estoque_atual' => 0, 'ativo' => true]);

        $create = $this->postJson('/api/entregas', [
            'material_id' => $material->id,
            'acolhido_id' => $acolhido->id,
            'quantidade' => 2,
            'data_entrega' => now()->toDateString(),
            'observacoes' => 'Obs',
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.material_id', $material->id)
            ->assertJsonPath('data.acolhido_id', $acolhido->id)
            ->assertJsonPath('data.entregue_por', $user->id);

        $entregaId = $create->json('data.id');

        $this->getJson('/api/entregas')
            ->assertOk()
            ->assertJsonStructure(['message', 'data']);

        $this->getJson("/api/entregas/{$entregaId}")
            ->assertOk()
            ->assertJsonPath('data.id', $entregaId);

        $this->patchJson("/api/entregas/{$entregaId}", ['quantidade' => 5])
            ->assertOk()
            ->assertJsonPath('data.quantidade', 5);

        $this->deleteJson("/api/entregas/{$entregaId}")
            ->assertOk();

        $this->assertDatabaseMissing('entregas', ['id' => $entregaId]);
    }

    public function test_unauthenticated_cannot_access_entregas(): void
    {
        $this->getJson('/api/entregas')->assertUnauthorized();
    }

    public function test_entrega_model_fillable_ignores_entregue_por_from_request(): void
    {
        $user = $this->actingAsUser();

        $material = Material::create(['nome' => 'Kit', 'unidade' => 'kit', 'categoria' => 'Teste', 'estoque_atual' => 0, 'ativo' => true]);
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

        $create = $this->postJson('/api/entregas', [
            'material_id' => $material->id,
            'familia_id' => $familia->id,
            'quantidade' => 1,
            'data_entrega' => now()->toDateString(),
            'entregue_por' => 999999,
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.entregue_por', $user->id);

        $this->assertDatabaseHas('entregas', [
            'id' => $create->json('data.id'),
            'entregue_por' => $user->id,
        ]);
    }
}
