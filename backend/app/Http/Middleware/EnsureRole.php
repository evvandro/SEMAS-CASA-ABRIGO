<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'message' => 'Não autenticado.',
            ], 401);
        }

        $allowedRoles = collect($roles)
            ->flatMap(fn (string $roleList) => preg_split('/\s*,\s*/', $roleList, -1, PREG_SPLIT_NO_EMPTY) ?: [])
            ->map(fn (string $role) => trim($role))
            ->filter()
            ->values();

        if ($allowedRoles->isNotEmpty() && ! $allowedRoles->contains((string) $user->role)) {
            return response()->json([
                'message' => 'Acesso restrito. Perfil sem permissão.',
            ], 403);
        }

        return $next($request);
    }
}
