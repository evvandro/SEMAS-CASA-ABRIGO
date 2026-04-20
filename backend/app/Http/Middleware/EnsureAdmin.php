<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json([
                'message' => 'Acesso restrito a administradores.',
            ], 403);
        }

        return $next($request);
    }
}
