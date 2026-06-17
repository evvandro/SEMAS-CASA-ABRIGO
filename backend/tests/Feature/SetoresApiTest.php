<?php

namespace Tests\Feature;

use App\Models\Acolhido;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SetoresApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_interdict_sector_and_beds(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => User::ROLE_ADMIN]));

        $setor = Setor::create([
            'nome' => 'Geriatria',
            'cor' => '#1565c0',
            'capacidade' => 8,
            'ativo' => true,
        ]);

        $this->patchJson("/api/setores/{$setor->id}", [
            'ativo' => false,
            'leitos_interditados' => ['2', '4'],
        ])
            ->assertOk()
            ->assertJsonPath('data.ativo', false)
            ->assertJsonPath('data.leitos_interditados', ['2', '4']);

        $this->getJson('/api/setores')
            ->assertOk()
            ->assertJsonPath('data.0.nome', 'Geriatria')
            ->assertJsonPath('data.0.ativo', false);

        $this->assertSame(['2', '4'], $setor->fresh()->leitos_interditados);
    }

    public function test_admin_cannot_delete_sector_with_active_residents(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => User::ROLE_ADMIN]));

        $setor = Setor::create([
            'nome' => 'Setor Ocupado',
            'cor' => '#ff0000',
            'capacidade' => 5,
            'ativo' => true,
        ]);

        Acolhido::create([
            'codigo_pulseira' => '0001',
            'nome' => 'João Ativo',
            'setor_id' => $setor->id,
            'data_entrada' => now()->toDateString(),
            'data_saida' => null,
        ]);

        $this->deleteJson("/api/setores/{$setor->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Setor possui acolhidos ativos e não pode ser removido.');

        $this->assertDatabaseHas('setores', ['id' => $setor->id]);
    }

    public function test_admin_can_delete_sector_without_active_residents(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => User::ROLE_ADMIN]));

        $setor = Setor::create([
            'nome' => 'Setor Vazio',
            'cor' => '#00ff00',
            'capacidade' => 5,
            'ativo' => true,
        ]);

        // Sector with only inactive (exited) resident
        Acolhido::create([
            'codigo_pulseira' => '0002',
            'nome' => 'Maria Ex-Moradora',
            'setor_id' => $setor->id,
            'data_entrada' => now()->subDays(5)->toDateString(),
            'data_saida' => now()->toDateString(),
            'tipo_saida' => 'alta',
        ]);

        $this->deleteJson("/api/setores/{$setor->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Setor removido com sucesso.');

        $this->assertDatabaseMissing('setores', ['id' => $setor->id]);
    }
}
