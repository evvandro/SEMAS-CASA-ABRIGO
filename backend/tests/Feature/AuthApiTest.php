<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_receive_token(): void
    {
        $password = 'SenhaForte123!';

        User::factory()->create([
            'email' => 'usuario@semas.sbs.gov.br',
            'password' => $password,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'usuario@semas.sbs.gov.br',
            'password' => $password,
            'device_name' => 'phpunit',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonStructure([
                'message',
                'data' => [
                    'token',
                    'token_type',
                    'user' => ['id', 'name', 'email', 'role', 'is_active'],
                ],
            ]);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'usuario@semas.sbs.gov.br',
            'password' => 'SenhaForte123!',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'usuario@semas.sbs.gov.br',
            'password' => 'SenhaInvalida999!',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Credenciais inválidas.');
    }

    public function test_inactive_user_cannot_login(): void
    {
        $password = 'SenhaForte123!';

        User::factory()->create([
            'email' => 'inativo@semas.sbs.gov.br',
            'password' => $password,
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'inativo@semas.sbs.gov.br',
            'password' => $password,
        ]);

        $response
            ->assertStatus(403)
            ->assertJsonPath('message', 'Este usuário está inativo. Entre em contato com o administrador.');
    }

    public function test_protected_route_requires_token(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/logout');

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Logout realizado com sucesso.');
    }
}
