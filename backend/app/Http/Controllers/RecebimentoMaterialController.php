<?php

namespace App\Http\Controllers;

use App\Models\Material;
use App\Models\RecebimentoMaterial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RecebimentoMaterialController extends Controller
{
    public function index(): JsonResponse
    {
        $recebimentos = RecebimentoMaterial::query()
            ->with('itens.material')
            ->latest('data_recebimento')
            ->latest('id')
            ->limit(20)
            ->get();

        return response()->json([
            'message' => 'Recebimentos listados com sucesso.',
            'data' => $recebimentos->map(fn (RecebimentoMaterial $recebimento) => $this->toArray($recebimento)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome_abrigo' => ['required', 'string', 'max:255'],
            'municipio_uf' => ['required', 'string', 'max:255'],
            'orgao_responsavel' => ['required', 'string', 'max:255'],
            'data_recebimento' => ['required', 'date'],
            'hora_recebimento' => ['required', 'date_format:H:i'],
            'origem' => ['required', 'string', 'max:80'],
            'origem_outro' => ['nullable', 'string', 'max:255'],
            'doador_nome' => ['required', 'string', 'max:255'],
            'doador_documento' => ['nullable', 'string', 'max:30'],
            'doador_contato' => ['nullable', 'string', 'max:80'],
            'conferido' => ['required', 'boolean'],
            'motivo_nao_conferido' => ['nullable', 'string', 'max:255'],
            'possui_restricao' => ['required', 'boolean'],
            'restricao_descricao' => ['nullable', 'string'],
            'destinacao_inicial' => ['required', Rule::in(['estoque', 'distribuicao_imediata', 'setor_especifico'])],
            'local_armazenamento' => ['nullable', 'string', 'max:255'],
            'recebido_por' => ['required', 'string', 'max:255'],
            'funcao_equipe' => ['nullable', 'string', 'max:255'],
            'entregue_por' => ['nullable', 'string', 'max:255'],
            'observacoes_gerais' => ['nullable', 'string'],
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.categoria' => ['required', 'string', 'max:80'],
            'itens.*.descricao' => ['required', 'string', 'max:255'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1'],
            'itens.*.unidade' => ['required', 'string', 'max:30'],
            'itens.*.condicao' => ['required', Rule::in(['novo', 'usado'])],
            'itens.*.observacoes' => ['nullable', 'string'],
        ]);

        $recebimento = DB::transaction(function () use ($data) {
            $itens = $data['itens'];
            unset($data['itens']);

            /** @var RecebimentoMaterial $recebimento */
            $recebimento = RecebimentoMaterial::create($data);

            foreach ($itens as $item) {
                /** @var Material $material */
                $material = Material::query()->firstOrCreate(
                    [
                        'nome' => $item['descricao'],
                        'unidade' => $item['unidade'],
                        'categoria' => $item['categoria'],
                    ],
                    [
                        'estoque_atual' => 0,
                        'ativo' => true,
                    ],
                );

                $material->increment('estoque_atual', $item['quantidade']);

                $recebimento->itens()->create([
                    ...$item,
                    'material_id' => $material->id,
                ]);
            }

            return $recebimento->load('itens.material');
        });

        return response()->json([
            'message' => 'Recebimento registrado com sucesso.',
            'data' => $this->toArray($recebimento),
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function toArray(RecebimentoMaterial $recebimento): array
    {
        return [
            'id' => $recebimento->id,
            'nome_abrigo' => $recebimento->nome_abrigo,
            'municipio_uf' => $recebimento->municipio_uf,
            'orgao_responsavel' => $recebimento->orgao_responsavel,
            'data_recebimento' => $recebimento->data_recebimento?->toDateString(),
            'hora_recebimento' => substr((string) $recebimento->hora_recebimento, 0, 5),
            'origem' => $recebimento->origem,
            'doador_nome' => $recebimento->doador_nome,
            'destinacao_inicial' => $recebimento->destinacao_inicial,
            'recebido_por' => $recebimento->recebido_por,
            'itens' => $recebimento->itens->map(fn ($item) => [
                'id' => $item->id,
                'material_id' => $item->material_id,
                'categoria' => $item->categoria,
                'descricao' => $item->descricao,
                'quantidade' => $item->quantidade,
                'unidade' => $item->unidade,
                'condicao' => $item->condicao,
                'observacoes' => $item->observacoes,
            ])->values(),
        ];
    }
}
