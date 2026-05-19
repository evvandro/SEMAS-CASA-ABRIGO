<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RestrictedUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => env('ADMIN_SEMAS_NAME', 'Administrador SEMAS'),
                'email' => env('ADMIN_SEMAS_EMAIL', env('ADMIN_EMAIL', 'adm@semas.gov')),
                'password' => env('ADMIN_SEMAS_PASSWORD', env('ADMIN_PASSWORD', '')),
                'role' => User::ROLE_ADMIN,
                'is_active' => true,
            ],
            [
                'name' => env('ADMIN_DEV_NAME', 'Evandro Cieslinsky'),
                'email' => env('ADMIN_DEV_EMAIL', 'evandro.cieslinsky@univille.br'),
                'password' => env('ADMIN_DEV_PASSWORD', ''),
                'role' => User::ROLE_ADMIN,
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            if ($userData['password'] === '') {
                continue;
            }

            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'role' => $userData['role'],
                    'is_active' => $userData['is_active'],
                    'phone' => null,
                    'documento' => null,
                ]
            );
        }
    }
}
