<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_can_list_all_users(): void
    {
        Sanctum::actingAs($this->admin());
        User::factory()->count(3)->create();

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonStructure([
                'message',
                'data' => [['id', 'name', 'email', 'role', 'is_active']],
            ]);
    }

    public function test_admin_can_create_user(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/admin/users', [
            'name'     => 'Nova Técnica',
            'email'    => 'tecnica2@semas.gov.br',
            'password' => 'Senha123!',
            'role'     => 'tecnico',
        ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'tecnica2@semas.gov.br')
            ->assertJsonPath('data.role', 'tecnico');

        $this->assertDatabaseHas('users', ['email' => 'tecnica2@semas.gov.br']);
    }

    public function test_admin_cannot_create_user_with_duplicate_email(): void
    {
        Sanctum::actingAs($this->admin());
        User::factory()->create(['email' => 'existente@semas.gov.br']);

        $this->postJson('/api/admin/users', [
            'name'     => 'Outro',
            'email'    => 'existente@semas.gov.br',
            'password' => 'Senha123!',
            'role'     => 'tecnico',
        ])->assertUnprocessable();
    }

    public function test_admin_cannot_create_user_with_invalid_role(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/admin/users', [
            'name'     => 'Teste',
            'email'    => 'teste@semas.gov.br',
            'password' => 'Senha123!',
            'role'     => 'superuser',
        ])->assertUnprocessable();
    }

    public function test_admin_can_update_user_role(): void
    {
        Sanctum::actingAs($this->admin());
        $user = User::factory()->create(['role' => 'tecnico']);

        $this->patchJson("/api/admin/users/{$user->id}", ['role' => 'logistica'])
            ->assertOk()
            ->assertJsonPath('data.role', 'logistica');
    }

    public function test_admin_can_deactivate_user(): void
    {
        Sanctum::actingAs($this->admin());
        $user = User::factory()->create(['is_active' => true]);

        $this->deleteJson("/api/admin/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Usuário desativado com sucesso.');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'is_active' => false]);
    }

    public function test_admin_cannot_deactivate_themselves(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/users/{$admin->id}")
            ->assertStatus(403);
    }

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'tecnico']));

        $this->getJson('/api/admin/users')->assertStatus(403);
        $this->postJson('/api/admin/users', [])->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_admin_routes(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
    }
}
