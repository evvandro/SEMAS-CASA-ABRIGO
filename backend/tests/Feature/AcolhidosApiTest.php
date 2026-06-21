<?php

namespace Tests\Feature;

use App\Models\Familia;
use App\Models\Setor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AcolhidosApiTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_can_crud_acolhido(): void
    {
        $this->actingAsUser();

        $setor = Setor::create(['nome' => 'Teste', 'cor' => '#000000', 'capacidade' => 10, 'ativo' => true]);
        $familia = Familia::create([
            'codigo' => Familia::gerarCodigo(),
            'responsavel_nome' => 'Resp',
            'setor_id' => $setor->id,
            'observacoes' => null,
            'data_entrada' => now()->toDateString(),
            'data_saida' => null,
            'tipo_saida' => null,
        ]);

        $create = $this->postJson('/api/acolhidos', [
            'familia_id' => $familia->id,
            'setor_id' => $setor->id,
            'nome' => 'João da Silva',
            'data_nascimento' => '1990-01-01',
            'cpf' => '12345678901',
            'telefone' => '47999999999',
            'genero' => 'masculino',
            'leito' => 'A1',
            'observacoes' => 'Obs',
            'pertences_registrados' => 'Mochila azul, sacola com roupas e documentos pessoais.',
            'data_entrada' => now()->toDateString(),
            'hora_entrada' => '08:35',
            'pcd' => true,
            'gestante' => false,
            'cronica' => true,
            'idoso' => false,
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.nome', 'João da Silva')
            ->assertJsonPath('data.pcd', true)
            ->assertJsonPath('data.cronica', true)
            ->assertJsonPath('data.hora_entrada', '08:35')
            ->assertJsonPath('data.pertences_registrados', 'Mochila azul, sacola com roupas e documentos pessoais.')
            ->assertJsonStructure(['message', 'data' => ['id', 'codigo_pulseira']]);

        $acolhidoId = $create->json('data.id');

        $this->getJson('/api/acolhidos')
            ->assertOk()
            ->assertJsonStructure(['message', 'data']);

        $this->getJson("/api/acolhidos/{$acolhidoId}")
            ->assertOk()
            ->assertJsonPath('data.id', $acolhidoId)
            ->assertJsonPath('data.hora_entrada', '08:35')
            ->assertJsonPath('data.pertences_registrados', 'Mochila azul, sacola com roupas e documentos pessoais.');

        $this->patchJson("/api/acolhidos/{$acolhidoId}", [
            'telefone' => '47999999999',
            'idoso' => true,
            'hora_entrada' => '09:10',
            'pertences_registrados' => 'Mochila azul atualizada.',
        ])
            ->assertOk()
            ->assertJsonPath('data.telefone', '47999999999')
            ->assertJsonPath('data.idoso', true)
            ->assertJsonPath('data.hora_entrada', '09:10')
            ->assertJsonPath('data.pertences_registrados', 'Mochila azul atualizada.');

        $this->postJson("/api/acolhidos/{$acolhidoId}/saida", [
            'data_saida' => now()->toDateString(),
            'tipo_saida' => 'alta',
        ])
            ->assertOk()
            ->assertJsonPath('data.ativo', false);

        $this->assertDatabaseHas('acolhidos', [
            'id' => $acolhidoId,
            'pcd' => true,
            'cronica' => true,
            'idoso' => true,
            'hora_entrada' => '09:10',
            'pertences_registrados' => 'Mochila azul atualizada.',
        ]);
    }

    public function test_create_requires_nome_and_data_entrada(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/acolhidos', [])
            ->assertUnprocessable();
    }

    public function test_can_create_individual_without_cpf_or_family(): void
    {
        $this->actingAsUser();

        $setor = Setor::create(['nome' => 'Individual', 'cor' => '#111111', 'capacidade' => 10, 'ativo' => true]);

        $response = $this->postJson('/api/acolhidos', [
            'setor_id' => $setor->id,
            'nome' => 'Maria Sem CPF',
            'data_entrada' => now()->toDateString(),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.nome', 'Maria Sem CPF')
            ->assertJsonPath('data.cpf', null);

        $this->assertDatabaseHas('acolhidos', [
            'id' => $response->json('data.id'),
            'familia_id' => null,
            'cpf' => null,
        ]);
    }

    public function test_rejects_invalid_cpf_when_present(): void
    {
        $this->actingAsUser();

        $setor = Setor::create(['nome' => 'CPF', 'cor' => '#222222', 'capacidade' => 10, 'ativo' => true]);

        $this->postJson('/api/acolhidos', [
            'setor_id' => $setor->id,
            'nome' => 'CPF Invalido',
            'cpf' => '123',
            'data_entrada' => now()->toDateString(),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cpf');
    }

    public function test_rejects_invalid_or_future_birth_date_with_clear_message(): void
    {
        $this->actingAsUser();

        $setor = Setor::create(['nome' => 'Datas', 'cor' => '#444444', 'capacidade' => 10, 'ativo' => true]);

        $this->postJson('/api/acolhidos', [
            'setor_id' => $setor->id,
            'nome' => 'Data Invalida',
            'data_nascimento' => 'data-invalida',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('data_nascimento')
            ->assertJsonPath('errors.data_nascimento.0', 'Informe uma data de nascimento válida.');

        $this->postJson('/api/acolhidos', [
            'setor_id' => $setor->id,
            'nome' => 'Data Futura',
            'data_nascimento' => now()->addDay()->toDateString(),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('data_nascimento')
            ->assertJsonPath('errors.data_nascimento.0', 'A data de nascimento não pode ser futura.');
    }

    public function test_saida_accepts_form_date_and_legacy_tipo_field(): void
    {
        $this->actingAsUser();

        $setor = Setor::create(['nome' => 'Saida', 'cor' => '#333333', 'capacidade' => 10, 'ativo' => true]);
        $acolhido = $this->postJson('/api/acolhidos', [
            'setor_id' => $setor->id,
            'nome' => 'Pessoa Saida',
            'data_entrada' => now()->toDateString(),
        ])->json('data');

        $this->postJson("/api/acolhidos/{$acolhido['id']}/saida", [
            'data_saida' => now()->format('d/m/Y'),
            'hora_saida' => '',
            'tipo_desligamento' => 'Retorno para residencia',
        ])
            ->assertOk()
            ->assertJsonPath('data.ativo', false);

        $this->assertDatabaseHas('acolhidos', [
            'id' => $acolhido['id'],
            'tipo_saida' => 'Retorno para residencia',
        ]);
    }

    public function test_unauthenticated_cannot_access_acolhidos(): void
    {
        $this->getJson('/api/acolhidos')->assertUnauthorized();
    }
}
