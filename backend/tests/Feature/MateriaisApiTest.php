<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MateriaisApiTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(): void
    {
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_can_crud_material(): void
    {
        $this->actingAsUser();

        $create = $this->postJson('/api/materiais', [
            'nome' => 'Camiseta',
            'unidade' => 'unidade',
            'categoria' => 'Vestuário',
            'estoque_atual' => 10,
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.nome', 'Camiseta');

        $materialId = $create->json('data.id');

        $this->getJson('/api/materiais')
            ->assertOk()
            ->assertJsonStructure(['message', 'data']);

        $this->patchJson("/api/materiais/{$materialId}", ['estoque_atual' => 99])
            ->assertOk()
            ->assertJsonPath('data.estoque_atual', 99);

        $this->assertDatabaseHas('materiais', ['id' => $materialId]);
    }

    public function test_create_requires_nome(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/materiais', [])
            ->assertUnprocessable();
    }

    public function test_unauthenticated_cannot_access_materiais(): void
    {
        $this->getJson('/api/materiais')->assertUnauthorized();
    }
}
