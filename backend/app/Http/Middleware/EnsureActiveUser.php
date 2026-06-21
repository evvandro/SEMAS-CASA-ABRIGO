<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next): mixed
    {
        $user = $request->user();

        if ($user === null || ! $user->is_active) {
            $user?->currentAccessToken()?->delete();

            return new JsonResponse([
                'message' => 'Sua conta está inativa. Entre em contato com o administrador.',
            ], 401);
        }

        return $next($request);
    }
}
