<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Throwable;

class AuthController extends Controller
{
    /**
     * Handle login with restricted users and issue a Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $email = $request->string('email')->toString();
        $password = $request->string('password')->toString();

        try {
            /** @var User|null $user */
            $user = User::query()->where('email', $email)->first();
        } catch (Throwable $exception) {
            Log::error('Falha ao autenticar usuário por indisponibilidade do banco.', [
                'email' => $email,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.',
            ], 503);
        }

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 422);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Este usuário está inativo. Entre em contato com o administrador.',
            ], 403);
        }

        $deviceName = $request->string('device_name')->toString();
        if ($deviceName === '') {
            $deviceName = 'frontend-web';
        }

        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => new UserResource($user),
            ],
        ]);
    }

    /**
     * Return the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Usuário autenticado.',
            'data' => [
                'user' => new UserResource($request->user()),
            ],
        ]);
    }

    /**
     * Revoke current API token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }
}
