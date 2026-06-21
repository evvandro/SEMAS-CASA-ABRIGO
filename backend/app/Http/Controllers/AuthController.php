<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Throwable;

class AuthController extends Controller
{
    private const DUMMY_PASSWORD_HASH = '$2y$12$wqkz7QuWR7qA1B9necKa5ONHxfj002hnGbrNQp135Dsh4OGobcnV6';

    /**
     * Handle login with restricted users and issue a Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $email = $request->string('email')->toString();
        $password = $request->string('password')->toString();
        $emailFingerprint = substr(hash('sha256', mb_strtolower($email)), 0, 16);

        Log::info('Tentativa de login recebida.', [
            'email_fingerprint' => $emailFingerprint,
            'device_name' => $request->string('device_name')->toString() ?: 'frontend-web',
        ]);

        try {
            /** @var User|null $user */
            $user = User::query()->where('email', $email)->first();
        } catch (Throwable $exception) {
            $driver = config('database.default');

            Log::error('Falha ao autenticar usuário por indisponibilidade do banco.', [
                'email_fingerprint' => $emailFingerprint,
                'db_driver' => $driver,
                'db_host' => config("database.connections.{$driver}.host", 'n/a'),
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.',
            ], 503);
        }

        $passwordIsValid = Hash::check($password, $user?->password ?? self::DUMMY_PASSWORD_HASH);

        if (! $user || ! $passwordIsValid) {
            Log::warning('Login rejeitado por credenciais invalidas.', [
                'email_fingerprint' => $emailFingerprint,
                'user_found' => $user !== null,
            ]);

            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 422);
        }

        if (! $user->is_active) {
            Log::warning('Login rejeitado para usuario inativo.', [
                'user_id' => $user->id,
                'email_fingerprint' => $emailFingerprint,
            ]);

            return response()->json([
                'message' => 'Este usuário está inativo. Entre em contato com o administrador.',
            ], 403);
        }

        $deviceName = $request->string('device_name')->toString();
        if ($deviceName === '') {
            $deviceName = 'frontend-web';
        }

        try {
            $expirationMinutes = max(1, (int) config('sanctum.expiration', 480));
            $expiresAt = now()->addMinutes($expirationMinutes);

            $user->tokens()
                ->where(function ($query): void {
                    $query
                        ->where('expires_at', '<=', now())
                        ->orWhereNull('expires_at');
                })
                ->delete();

            $token = $user->createToken($deviceName, ['*'], $expiresAt)->plainTextToken;

            $excessTokenIds = $user->tokens()
                ->latest('id')
                ->pluck('id')
                ->skip(5);

            if ($excessTokenIds->isNotEmpty()) {
                $user->tokens()->whereKey($excessTokenIds)->delete();
            }
        } catch (Throwable $exception) {
            Log::error('Falha ao emitir token de autenticacao.', [
                'user_id' => $user->id,
                'email_fingerprint' => $emailFingerprint,
                'exception' => $exception,
            ]);

            return response()->json([
                'message' => 'Serviço de autenticação temporariamente indisponível. Tente novamente em instantes.',
            ], 503);
        }

        Log::info('Login realizado com sucesso.', [
            'user_id' => $user->id,
            'role' => $user->role,
            'email_fingerprint' => $emailFingerprint,
        ]);

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
     * Update the authenticated user's profile.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validated();
        $passwordChanged = array_key_exists('password', $validated);

        if ($passwordChanged && ! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Senha atual incorreta.',
            ], 422);
        }

        if ($passwordChanged) {
            $user->password = $validated['password'];
            unset($validated['password']);
            unset($validated['password_confirmation']);
        }

        unset($validated['current_password']);

        $user->fill($validated);
        $user->save();

        if ($passwordChanged) {
            $currentTokenId = $user->currentAccessToken()?->getKey();
            $otherTokens = $user->tokens();

            if ($currentTokenId !== null) {
                $otherTokens->whereKeyNot($currentTokenId);
            }

            $otherTokens->delete();

            Log::info('Senha alterada e demais tokens revogados.', [
                'user_id' => $user->id,
            ]);
        }

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'data' => [
                'user' => new UserResource($user->fresh()),
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
