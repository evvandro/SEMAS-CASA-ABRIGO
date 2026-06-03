<?php

namespace Tests\Feature;

use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RecebimentosApiTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsUser(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        return $user;
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function basePayload(array $overrides = []): array
    {
        return array_merge([
            'nome_abrigo' => 'Abrigo Temporario',
            'municipio_uf' => 'Sao Bento do Sul/SC',
            'orgao_responsavel' => 'SEMAS',
            'data_recebimento' => now()->toDateString(),
            'hora_recebimento' => '10:30',
            'origem' => 'Doacao',
            'doador_nome' => 'Doador Teste',
            'conferido' => true,
            'possui_restricao' => false,
            'destinacao_inicial' => 'estoque',
            'recebido_por' => 'Equipe',
        ], $overrides);
    }

    public function test_recebimento_seleciona_material_do_catalogo_e_incrementa_estoque(): void
    {
        $this->actingAsUser();

        $material = Material::create(['nome' => 'Cobertor', 'unidade' => 'unidade', 'categoria' => 'Abrigo', 'estoque_atual' => 0, 'ativo' => true]);

        $this->postJson('/api/recebimentos-materiais', $this->basePayload([
            'itens' => [
                ['material_id' => $material->id, 'quantidade' => 5, 'condicao' => 'novo', 'observacoes' => null],
            ],
        ]))->assertCreated();

        // Nenhum material novo e criado; o saldo do item do catalogo sobe.
        $this->assertSame(1, Material::count());
        $this->assertSame(5, $material->fresh()->estoque_atual);

        // O item guarda o snapshot derivado do catalogo.
        $this->assertDatabaseHas('recebimento_material_itens', [
            'material_id' => $material->id,
            'descricao' => 'Cobertor',
            'unidade' => 'unidade',
            'categoria' => 'Abrigo',
            'quantidade' => 5,
        ]);
    }

    public function test_recebimento_exige_material_do_catalogo(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/recebimentos-materiais', $this->basePayload([
            'itens' => [
                ['quantidade' => 3, 'condicao' => 'novo'],
            ],
        ]))->assertUnprocessable()->assertJsonValidationErrors('itens.0.material_id');
    }

    public function test_recebimento_exige_motivo_quando_nao_conferido(): void
    {
        $this->actingAsUser();

        $material = Material::create(['nome' => 'Toalha', 'unidade' => 'unidade', 'categoria' => 'Higiene', 'estoque_atual' => 0, 'ativo' => true]);

        $this->postJson('/api/recebimentos-materiais', $this->basePayload([
            'conferido' => false,
            'itens' => [
                ['material_id' => $material->id, 'quantidade' => 1, 'condicao' => 'novo'],
            ],
        ]))->assertUnprocessable()->assertJsonValidationErrors('motivo_nao_conferido');
    }

    public function test_recebimento_exige_descricao_quando_possui_restricao(): void
    {
        $this->actingAsUser();

        $material = Material::create(['nome' => 'Agua Mineral', 'unidade' => 'garrafa', 'categoria' => 'Alimentacao', 'estoque_atual' => 0, 'ativo' => true]);

        $this->postJson('/api/recebimentos-materiais', $this->basePayload([
            'possui_restricao' => true,
            'itens' => [
                ['material_id' => $material->id, 'quantidade' => 1, 'condicao' => 'novo'],
            ],
        ]))->assertUnprocessable()->assertJsonValidationErrors('restricao_descricao');
    }
}
