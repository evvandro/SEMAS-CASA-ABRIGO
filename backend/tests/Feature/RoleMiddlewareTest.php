<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_receives_401(): void
    {
        $this->getJson('/api/setores')->assertUnauthorized();
    }

    public function test_wrong_role_receives_403(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'logistica']));

        $this->getJson('/api/setores')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Acesso restrito. Perfil sem permissão.');
    }
}
