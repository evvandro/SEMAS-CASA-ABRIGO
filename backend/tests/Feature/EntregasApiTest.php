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

        $material = Material::create(['nome' => 'Kit', 'unidade' => 'kit', 'categoria' => 'Teste', 'estoque_atual' => 10, 'ativo' => true]);

        $create = $this->postJson('/api/entregas', [
            'material_id' => $material->id,
            'acolhido_id' => $acolhido->id,
            'quantidade' => 2,
            'data_entrega' => now()->toDateString(),
            'observacoes' => 'Obs',
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.material.id', $material->id)
            ->assertJsonPath('data.acolhido.id', $acolhido->id);

        $entregaId = $create->json('data.id');

        $this->assertDatabaseHas('entregas', [
            'id' => $entregaId,
            'entregue_por' => $user->id,
        ]);

        $this->assertDatabaseHas('materiais', [
            'id' => $material->id,
            'estoque_atual' => 8,
        ]);

        $this->getJson('/api/entregas')
            ->assertOk()
            ->assertJsonStructure(['message', 'data']);

        $this->assertDatabaseHas('entregas', ['id' => $entregaId]);
    }

    public function test_unauthenticated_cannot_access_entregas(): void
    {
        $this->getJson('/api/entregas')->assertUnauthorized();
    }

    public function test_entrega_model_fillable_ignores_entregue_por_from_request(): void
    {
        $user = $this->actingAsUser();

        $material = Material::create(['nome' => 'Kit', 'unidade' => 'kit', 'categoria' => 'Teste', 'estoque_atual' => 10, 'ativo' => true]);
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

        $create = $this->postJson('/api/entregas', [
            'material_id' => $material->id,
            'familia_id' => $familia->id,
            'quantidade' => 1,
            'data_entrega' => now()->toDateString(),
            'entregue_por' => 999999,
        ]);

        $create->assertCreated();

        $this->assertDatabaseHas('entregas', [
            'id' => $create->json('data.id'),
            'entregue_por' => $user->id,
        ]);
    }

    public function test_cannot_create_entrega_with_insufficient_stock(): void
    {
        $this->actingAsUser();

        $material = Material::create(['nome' => 'Kit', 'unidade' => 'kit', 'categoria' => 'Teste', 'estoque_atual' => 1, 'ativo' => true]);
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

        $this->postJson('/api/entregas', [
            'material_id' => $material->id,
            'familia_id' => $familia->id,
            'quantidade' => 2,
            'data_entrega' => now()->toDateString(),
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Estoque insuficiente para realizar a entrega.');

        $this->assertDatabaseHas('materiais', [
            'id' => $material->id,
            'estoque_atual' => 1,
        ]);
    }

    public function test_can_create_entrega_lote_with_multiple_items(): void
    {
        $user = $this->actingAsUser();

        $setor = Setor::create(['nome' => 'Teste', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
        $acolhido = Acolhido::create([
            'codigo_pulseira' => Acolhido::gerarCodigoPulseira(),
            'setor_id' => $setor->id,
            'nome' => 'Pessoa',
            'data_entrada' => now()->toDateString(),
        ]);
        $kit = Material::create(['nome' => 'Kit higiene', 'unidade' => 'kit', 'categoria' => 'Higiene', 'estoque_atual' => 10, 'ativo' => true]);
        $coberta = Material::create(['nome' => 'Coberta', 'unidade' => 'unidade', 'categoria' => 'Cobertas', 'estoque_atual' => 4, 'ativo' => true]);

        $response = $this->postJson('/api/entregas/lote', [
            'destino_tipo' => 'acolhido',
            'acolhido_id' => $acolhido->id,
            'data_entrega' => now()->toDateString(),
            'finalidade' => 'Acolhimento inicial',
            'itens' => [
                ['material_id' => $kit->id, 'quantidade' => 2],
                ['material_id' => $coberta->id, 'quantidade' => 1],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.acolhido.id', $acolhido->id)
            ->assertJsonPath('data.0.entregue_por.id', $user->id);

        $grupoEntrega = $response->json('data.0.grupo_entrega');

        $this->assertNotEmpty($grupoEntrega);
        $this->assertSame($grupoEntrega, $response->json('data.1.grupo_entrega'));
        $this->assertDatabaseHas('materiais', ['id' => $kit->id, 'estoque_atual' => 8]);
        $this->assertDatabaseHas('materiais', ['id' => $coberta->id, 'estoque_atual' => 3]);
        $this->assertDatabaseHas('entregas', [
            'grupo_entrega' => $grupoEntrega,
            'destino_tipo' => 'acolhido',
            'finalidade' => 'Acolhimento inicial',
        ]);
    }

    public function test_entrega_lote_rolls_back_when_any_item_has_insufficient_stock(): void
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
        $kit = Material::create(['nome' => 'Kit', 'unidade' => 'kit', 'categoria' => 'Teste', 'estoque_atual' => 5, 'ativo' => true]);
        $coberta = Material::create(['nome' => 'Coberta', 'unidade' => 'unidade', 'categoria' => 'Teste', 'estoque_atual' => 1, 'ativo' => true]);

        $this->postJson('/api/entregas/lote', [
            'destino_tipo' => 'familia',
            'familia_id' => $familia->id,
            'data_entrega' => now()->toDateString(),
            'itens' => [
                ['material_id' => $kit->id, 'quantidade' => 2],
                ['material_id' => $coberta->id, 'quantidade' => 2],
            ],
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Estoque insuficiente para realizar a entrega.');

        $this->assertDatabaseCount('entregas', 0);
        $this->assertDatabaseHas('materiais', ['id' => $kit->id, 'estoque_atual' => 5]);
        $this->assertDatabaseHas('materiais', ['id' => $coberta->id, 'estoque_atual' => 1]);
    }

    public function test_entrega_lote_externa_requires_external_fields_and_does_not_require_internal_destination(): void
    {
        $this->actingAsUser();

        $material = Material::create(['nome' => 'Kit', 'unidade' => 'kit', 'categoria' => 'Teste', 'estoque_atual' => 3, 'ativo' => true]);

        $this->postJson('/api/entregas/lote', [
            'destino_tipo' => 'externo',
            'data_entrega' => now()->toDateString(),
            'itens' => [
                ['material_id' => $material->id, 'quantidade' => 1],
            ],
        ])->assertJsonValidationErrors('externo_nome');

        $response = $this->postJson('/api/entregas/lote', [
            'destino_tipo' => 'externo',
            'externo_nome' => 'Defesa Civil',
            'externo_documento' => '123',
            'externo_contato' => 'contato@exemplo.test',
            'externo_instituicao' => 'Orgao publico',
            'data_entrega' => now()->toDateString(),
            'itens' => [
                ['material_id' => $material->id, 'quantidade' => 1],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.0.destino_tipo', 'externo')
            ->assertJsonPath('data.0.externo_nome', 'Defesa Civil')
            ->assertJsonPath('data.0.familia', null)
            ->assertJsonPath('data.0.acolhido', null);

        $this->assertDatabaseHas('materiais', ['id' => $material->id, 'estoque_atual' => 2]);
    }

    public function test_cannot_create_entrega_lote_for_inactive_acolhido_or_familia(): void
    {
        $this->actingAsUser();

        $setor = Setor::create(['nome' => 'Teste', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
        $acolhido = Acolhido::create([
            'codigo_pulseira' => Acolhido::gerarCodigoPulseira(),
            'setor_id' => $setor->id,
            'nome' => 'Pessoa',
            'data_entrada' => now()->toDateString(),
            'data_saida' => now()->toDateString(),
            'tipo_saida' => 'alta',
        ]);
        $familia = Familia::create([
            'codigo' => Familia::gerarCodigo(),
            'responsavel_nome' => 'Resp',
            'setor_id' => $setor->id,
            'observacoes' => null,
            'data_entrada' => now()->toDateString(),
            'data_saida' => now()->toDateString(),
            'tipo_saida' => 'alta',
        ]);
        $material = Material::create(['nome' => 'Kit', 'unidade' => 'kit', 'categoria' => 'Teste', 'estoque_atual' => 3, 'ativo' => true]);

        $this->postJson('/api/entregas/lote', [
            'destino_tipo' => 'acolhido',
            'acolhido_id' => $acolhido->id,
            'data_entrega' => now()->toDateString(),
            'itens' => [
                ['material_id' => $material->id, 'quantidade' => 1],
            ],
        ])->assertJsonValidationErrors('acolhido_id');

        $this->postJson('/api/entregas/lote', [
            'destino_tipo' => 'familia',
            'familia_id' => $familia->id,
            'data_entrega' => now()->toDateString(),
            'itens' => [
                ['material_id' => $material->id, 'quantidade' => 1],
            ],
        ])->assertJsonValidationErrors('familia_id');

        $this->assertDatabaseHas('materiais', ['id' => $material->id, 'estoque_atual' => 3]);
    }
}
