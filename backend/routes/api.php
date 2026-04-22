<?php

use App\Http\Controllers\AcolhidoController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EntregaController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\MaterialController;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

RateLimiter::for('login', function (Request $request): Limit {
    return Limit::perMinute(8)->by((string) $request->ip());
});

Route::get('/health', HealthController::class);

Route::middleware('throttle:login')->post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('acolhidos', AcolhidoController::class);
    Route::apiResource('materiais', MaterialController::class)->parameters(['materiais' => 'material']);
    Route::apiResource('entregas', EntregaController::class);

    // Rotas exclusivas do administrador
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function (): void {
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    });
});
