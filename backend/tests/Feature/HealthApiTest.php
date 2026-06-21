<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthApiTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertHeader('X-Request-ID')
            ->assertJsonStructure([
                'message',
                'data' => ['status'],
            ])
            ->assertJsonPath('data.status', 'ok');
    }

    public function test_health_endpoint_preserves_valid_request_id(): void
    {
        $this->withHeader('X-Request-ID', 'frontend-test-123')
            ->getJson('/api/health')
            ->assertOk()
            ->assertHeader('X-Request-ID', 'frontend-test-123');
    }

    public function test_health_endpoint_does_not_expose_database_exception(): void
    {
        config(['database.default' => 'missing-connection']);

        $this->getJson('/api/health')
            ->assertStatus(503)
            ->assertJsonPath('data.status', 'error')
            ->assertJsonMissingPath('data.db_error');
    }
}
