<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class RestrictedUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [$this->adminFromConfig('admin')];

        if (! app()->isProduction()) {
            $users[] = $this->adminFromConfig('dev_admin');
        } else {
            $this->warnAboutExistingDevelopmentAdmin();
        }

        foreach ($users as $userData) {
            if ($userData['email'] === '' || $userData['password'] === '') {
                continue;
            }

            if (User::query()->where('email', $userData['email'])->exists()) {
                continue;
            }

            if (! $this->isStrongPassword($userData['password'])) {
                throw new RuntimeException('A senha inicial do administrador deve ter ao menos 12 caracteres, com maiúscula, minúscula, número e símbolo.');
            }

            User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'role' => User::ROLE_ADMIN,
                'is_active' => true,
                'phone' => null,
                'documento' => null,
            ]);
        }
    }

    /**
     * @return array{name: string, email: string, password: string}
     */
    private function adminFromConfig(string $key): array
    {
        return [
            'name' => trim((string) config("restricted_users.{$key}.name")),
            'email' => mb_strtolower(trim((string) config("restricted_users.{$key}.email"))),
            'password' => (string) config("restricted_users.{$key}.password"),
        ];
    }

    private function isStrongPassword(string $password): bool
    {
        return mb_strlen($password) >= 12
            && preg_match('/[a-z]/', $password) === 1
            && preg_match('/[A-Z]/', $password) === 1
            && preg_match('/\d/', $password) === 1
            && preg_match('/[^A-Za-z0-9]/', $password) === 1;
    }

    private function warnAboutExistingDevelopmentAdmin(): void
    {
        $email = mb_strtolower(trim((string) config('restricted_users.dev_admin.email')));

        if ($email === '') {
            return;
        }

        $user = User::query()->where('email', $email)->first();

        if ($user?->is_active) {
            Log::warning('Conta de desenvolvimento ativa em producao; desative-a no painel administrativo.', [
                'user_id' => $user->id,
            ]);
        }
    }
}
