<?php

use App\Http\Controllers\AcolhidoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FamiliaController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EntregaController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\SetorController;
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

    Route::middleware('role:admin,tecnico')->group(function (): void {
        Route::get('/setores', [SetorController::class, 'index']);
        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::get('/familias', [FamiliaController::class, 'index']);
        Route::post('/familias', [FamiliaController::class, 'store']);
        Route::get('/familias/{familia}', [FamiliaController::class, 'show']);
        Route::patch('/familias/{familia}', [FamiliaController::class, 'update']);
        Route::post('/familias/{familia}/saida', [FamiliaController::class, 'saida']);

        Route::get('/acolhidos', [AcolhidoController::class, 'index']);
        Route::post('/acolhidos', [AcolhidoController::class, 'store']);
        Route::get('/acolhidos/{acolhido}', [AcolhidoController::class, 'show']);
        Route::patch('/acolhidos/{acolhido}', [AcolhidoController::class, 'update']);
        Route::post('/acolhidos/{acolhido}/saida', [AcolhidoController::class, 'saida']);

        Route::get('/materiais', [MaterialController::class, 'index']);
        Route::post('/materiais', [MaterialController::class, 'store']);
        Route::patch('/materiais/{material}', [MaterialController::class, 'update']);

        Route::get('/entregas', [EntregaController::class, 'index']);
        Route::post('/entregas', [EntregaController::class, 'store']);
    });

    // Rotas exclusivas do administrador
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function (): void {
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    });
});
