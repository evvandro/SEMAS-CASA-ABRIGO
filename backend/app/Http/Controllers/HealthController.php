<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $dbStatus = 'ok';
        $dbError = null;
        $dbDriver = config('database.default');
        $dbHost = config("database.connections.{$dbDriver}.host", 'n/a');

        try {
            DB::connection()->getPdo();
        } catch (Throwable $e) {
            $dbStatus = 'error';
            $dbError = $e->getMessage();
        }

        return response()->json([
            'message' => $dbStatus === 'ok' ? 'API online.' : 'DB unreachable.',
            'data' => [
                'status' => $dbStatus,
                'db_driver' => $dbDriver,
                'db_host' => $dbHost,
                'db_error' => $dbError,
                'config_cached' => app()->configurationIsCached(),
                'env_db_connection' => env('DB_CONNECTION'),
                'pgsql_host_config' => config('database.connections.pgsql.host'),
            ],
        ], $dbStatus === 'ok' ? 200 : 503);
    }
}
