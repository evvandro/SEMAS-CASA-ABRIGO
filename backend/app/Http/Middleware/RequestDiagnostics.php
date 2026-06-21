<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class RequestDiagnostics
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $this->requestId($request);
        $startedAt = hrtime(true);

        $request->attributes->set('request_id', $requestId);

        Log::withContext([
            'request_id' => $requestId,
            'method' => $request->method(),
            'path' => $request->path(),
        ]);

        try {
            $response = $next($request);
        } catch (Throwable $exception) {
            Log::error('Excecao nao tratada durante requisicao da API.', [
                'duration_ms' => $this->durationInMilliseconds($startedAt),
                'exception' => $exception,
            ]);

            throw $exception;
        }

        $response->headers->set('X-Request-ID', $requestId);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        $response->headers->set('X-Frame-Options', 'DENY');

        if ($request->is('api/login') || $request->user() !== null) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        if (app()->isProduction() && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        $context = [
            'status' => $response->getStatusCode(),
            'duration_ms' => $this->durationInMilliseconds($startedAt),
            'user_id' => $request->user()?->getAuthIdentifier(),
            'ip' => $request->ip(),
        ];

        if ($response->getStatusCode() >= 500) {
            Log::error('Requisicao da API concluida com erro do servidor.', $context);
        } elseif ($response->getStatusCode() >= 400) {
            Log::warning('Requisicao da API rejeitada.', $context);
        } else {
            Log::info('Requisicao da API concluida.', $context);
        }

        return $response;
    }

    private function requestId(Request $request): string
    {
        $requestId = (string) $request->header('X-Request-ID', '');

        if (preg_match('/^[A-Za-z0-9._-]{8,100}$/', $requestId) === 1) {
            return $requestId;
        }

        return (string) Str::uuid();
    }

    private function durationInMilliseconds(int $startedAt): float
    {
        return round((hrtime(true) - $startedAt) / 1_000_000, 2);
    }
}
