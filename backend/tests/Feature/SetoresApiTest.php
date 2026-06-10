<?php

namespace Tests\Feature;

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
}
