<?php

namespace Tests\Feature;

use App\Models\Setor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_expected_keys(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));
        Setor::create(['nome' => 'Teste', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'message',
                'data' => [
                    'familias_ativas',
                    'acolhidos_ativos',
                    'entregas_hoje',
                    'setores',
                ],
            ]);
    }
}
