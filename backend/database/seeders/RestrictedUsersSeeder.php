<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RestrictedUsersSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $basePassword = env('DEFAULT_RESTRICTED_PASSWORD', 'Univille@');

        $users = [
            [
                'name' => env('ADMIN_NAME', 'Administrador SEMAS'),
                'email' => env('ADMIN_EMAIL', 'admin@semas.sbs.gov.br'),
                'password' => env('ADMIN_PASSWORD', $basePassword),
                'role' => User::ROLE_ADMIN,
                'is_active' => true,
                'phone' => null,
                'documento' => null,
            ],
            [
                'name' => 'Equipe Técnica',
                'email' => 'tecnico@semas.sbs.gov.br',
                'password' => $basePassword,
                'role' => User::ROLE_TECNICO,
                'is_active' => true,
                'phone' => null,
                'documento' => null,
            ],
            [
                'name' => 'Equipe Logística',
                'email' => 'logistica@semas.sbs.gov.br',
                'password' => $basePassword,
                'role' => User::ROLE_LOGISTICA,
                'is_active' => true,
                'phone' => null,
                'documento' => null,
            ],
            [
                'name' => 'Equipe Saúde',
                'email' => 'saude@semas.sbs.gov.br',
                'password' => $basePassword,
                'role' => User::ROLE_SAUDE,
                'is_active' => true,
                'phone' => null,
                'documento' => null,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'role' => $userData['role'],
                    'is_active' => $userData['is_active'],
                    'phone' => $userData['phone'],
                    'documento' => $userData['documento'],
                ]
            );
        }
    }
}
