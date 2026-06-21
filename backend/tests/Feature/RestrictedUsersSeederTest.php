<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RestrictedUsersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RestrictedUsersSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_does_not_reset_existing_admin_password_or_status(): void
    {
        config()->set('restricted_users.admin', [
            'name' => 'Administrador SEMAS',
            'email' => 'admin@semas.sbs.gov.br',
            'password' => 'SenhaInicial123!',
        ]);
        config()->set('restricted_users.dev_admin', [
            'name' => '',
            'email' => '',
            'password' => '',
        ]);

        $this->seed(RestrictedUsersSeeder::class);

        $admin = User::query()->where('email', 'admin@semas.sbs.gov.br')->firstOrFail();
        $admin->update([
            'password' => 'SenhaAlterada123!',
            'is_active' => false,
        ]);

        $this->seed(RestrictedUsersSeeder::class);

        $admin->refresh();
        $this->assertFalse($admin->is_active);
        $this->assertTrue(Hash::check('SenhaAlterada123!', $admin->password));
    }
}
