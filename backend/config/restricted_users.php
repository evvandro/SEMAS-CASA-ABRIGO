<?php

return [
    'admin' => [
        'name' => env('ADMIN_SEMAS_NAME', env('ADMIN_NAME', 'Administrador SEMAS')),
        'email' => env('ADMIN_SEMAS_EMAIL', env('ADMIN_EMAIL', '')),
        'password' => env('ADMIN_SEMAS_PASSWORD', env('ADMIN_PASSWORD', '')),
    ],

    'dev_admin' => [
        'name' => env('ADMIN_DEV_NAME', 'Administrador de desenvolvimento'),
        'email' => env('ADMIN_DEV_EMAIL', ''),
        'password' => env('ADMIN_DEV_PASSWORD', ''),
    ],
];
