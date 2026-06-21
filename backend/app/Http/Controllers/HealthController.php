<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $dbStatus = 'ok';
        $dbDriver = config('database.default');

        try {
            DB::connection()->getPdo();
        } catch (Throwable $e) {
            $dbStatus = 'error';

            Log::error('Health check detectou banco de dados indisponivel.', [
                'db_driver' => $dbDriver,
                'db_host' => config("database.connections.{$dbDriver}.host", 'n/a'),
                'db_port' => config("database.connections.{$dbDriver}.port", 'n/a'),
                'db_database' => config("database.connections.{$dbDriver}.database", 'n/a'),
                'exception' => $e,
            ]);
        }

        return response()->json([
            'message' => $dbStatus === 'ok' ? 'API online.' : 'DB unreachable.',
            'data' => [
                'status' => $dbStatus,
                'db_driver' => $dbDriver,
            ],
        ], $dbStatus === 'ok' ? 200 : 503);
    }
}
