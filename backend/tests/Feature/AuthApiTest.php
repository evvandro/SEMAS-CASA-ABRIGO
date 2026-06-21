<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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
            ->assertHeader('X-Request-ID')
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonStructure([
                'message',
                'data' => [
                    'token',
                    'token_type',
                    'user' => ['id', 'name', 'email', 'role', 'is_active'],
                ],
            ]);

        $this->assertNotNull(User::firstOrFail()->tokens()->firstOrFail()->expires_at);
    }

    public function test_login_normalizes_email_before_authentication(): void
    {
        User::factory()->create([
            'email' => 'usuario@semas.sbs.gov.br',
            'password' => 'SenhaForte123!',
        ]);

        $this->postJson('/api/login', [
            'email' => '  USUARIO@SEMAS.SBS.GOV.BR  ',
            'password' => 'SenhaForte123!',
        ])->assertOk();
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

    public function test_inactive_user_with_existing_token_is_logged_out(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $token = $user->createToken('phpunit');
        $user->update(['is_active' => false]);

        $this->withToken($token->plainTextToken)
            ->getJson('/api/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Sua conta está inativa. Entre em contato com o administrador.');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $token->accessToken->id,
        ]);
    }

    public function test_password_change_requires_current_password(): void
    {
        $user = User::factory()->create(['password' => 'SenhaAtual123!']);
        $token = $user->createToken('phpunit');

        $this->withToken($token->plainTextToken)
            ->patchJson('/api/me', [
                'password' => 'NovaSenhaForte123!',
                'password_confirmation' => 'NovaSenhaForte123!',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');

        $this->assertTrue(Hash::check('SenhaAtual123!', $user->fresh()->password));
    }

    public function test_expired_token_cannot_access_protected_routes(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('expired', ['*'], now()->subMinute());

        $this->withToken($token->plainTextToken)
            ->getJson('/api/me')
            ->assertUnauthorized();
    }

    public function test_password_change_keeps_current_token_and_revokes_other_tokens(): void
    {
        $user = User::factory()->create(['password' => 'SenhaAtual123!']);
        $currentToken = $user->createToken('current');
        $otherToken = $user->createToken('other');

        $this->withToken($currentToken->plainTextToken)
            ->patchJson('/api/me', [
                'current_password' => 'SenhaAtual123!',
                'password' => 'NovaSenhaForte123!',
                'password_confirmation' => 'NovaSenhaForte123!',
            ])
            ->assertOk();

        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $currentToken->accessToken->id,
        ]);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $otherToken->accessToken->id,
        ]);
        $this->assertTrue(Hash::check('NovaSenhaForte123!', $user->fresh()->password));
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

    public function test_login_is_rate_limited_by_email_and_ip(): void
    {
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/login', [
                'email' => 'rate-limit@semas.sbs.gov.br',
                'password' => 'SenhaInvalida123!',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/login', [
            'email' => 'rate-limit@semas.sbs.gov.br',
            'password' => 'SenhaInvalida123!',
        ])->assertTooManyRequests();
    }
}
