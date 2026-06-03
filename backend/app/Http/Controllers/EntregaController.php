<?php

namespace App\Http\Controllers;

use App\Http\Requests\Entregas\StoreEntregaLoteRequest;
use App\Http\Requests\Entregas\StoreEntregaRequest;
use App\Http\Resources\EntregaResource;
use App\Models\Entrega;
use App\Models\Material;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EntregaController extends Controller
{
    public function index(): JsonResponse
    {
        $entregas = Entrega::query()
            ->with(['material', 'familia', 'acolhido', 'entreguePor'])
            ->orderByDesc('data_entrega')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'message' => 'Entregas listadas com sucesso.',
            'data' => EntregaResource::collection($entregas),
        ]);
    }

    public function show(Entrega $entrega): JsonResponse
    {
        return response()->json([
            'message' => 'Entrega obtida com sucesso.',
            'data' => new EntregaResource($entrega->load(['material', 'familia', 'acolhido', 'entreguePor'])),
        ]);
    }

    public function store(StoreEntregaRequest $request): JsonResponse
    {
        $data = $request->validated();

        $entregas = DB::transaction(function () use ($data, $request) {
            $item = [
                'material_id' => (int) $data['material_id'],
                'quantidade' => (int) $data['quantidade'],
            ];

            return $this->createEntregas(
                [
                    'grupo_entrega' => (string) Str::uuid(),
                    'familia_id' => $data['familia_id'] ?? null,
                    'acolhido_id' => $data['acolhido_id'] ?? null,
                    'destino_tipo' => filled($data['familia_id'] ?? null) ? 'familia' : 'acolhido',
                    'data_entrega' => $data['data_entrega'],
                    'finalidade' => $data['finalidade'] ?? null,
                    'observacoes' => $data['observacoes'] ?? null,
                    'entregue_por' => $request->user()?->id,
                ],
                [$item],
            );
        });

        $entrega = $entregas->first()->load(['material', 'familia', 'acolhido', 'entreguePor']);

        return response()->json([
            'message' => 'Entrega criada com sucesso.',
            'data' => new EntregaResource($entrega),
        ], 201);
    }

    public function storeLote(StoreEntregaLoteRequest $request): JsonResponse
    {
        $data = $request->validated();

        $entregas = DB::transaction(function () use ($data, $request) {
            return $this->createEntregas(
                [
                    'grupo_entrega' => (string) Str::uuid(),
                    'familia_id' => $data['destino_tipo'] === 'familia' ? $data['familia_id'] : null,
                    'acolhido_id' => $data['destino_tipo'] === 'acolhido' ? $data['acolhido_id'] : null,
                    'destino_tipo' => $data['destino_tipo'],
                    'externo_nome' => $data['destino_tipo'] === 'externo' ? $data['externo_nome'] : null,
                    'externo_documento' => $data['destino_tipo'] === 'externo' ? ($data['externo_documento'] ?? null) : null,
                    'externo_contato' => $data['destino_tipo'] === 'externo' ? ($data['externo_contato'] ?? null) : null,
                    'externo_instituicao' => $data['destino_tipo'] === 'externo' ? ($data['externo_instituicao'] ?? null) : null,
                    'data_entrega' => $data['data_entrega'],
                    'finalidade' => $data['finalidade'] ?? null,
                    'observacoes' => $data['observacoes'] ?? null,
                    'entregue_por' => $request->user()?->id,
                ],
                $data['itens'],
            );
        });

        $entregas->load(['material', 'familia', 'acolhido', 'entreguePor']);

        return response()->json([
            'message' => 'Distribuição criada com sucesso.',
            'data' => EntregaResource::collection($entregas),
        ], 201);
    }

    /**
     * @param  array<string, mixed>  $baseData
     * @param  array<int, array{material_id:int, quantidade:int}>  $itens
     * @return Collection<int, Entrega>
     */
    private function createEntregas(array $baseData, array $itens): Collection
    {
        $itensAgrupados = collect($itens)
            ->groupBy(fn (array $item): int => (int) $item['material_id'])
            ->map(fn ($itensDoMaterial): int => $itensDoMaterial->sum(fn (array $item): int => (int) $item['quantidade']));

        $materiais = Material::query()
            ->whereIn('id', $itensAgrupados->keys()->all())
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($itensAgrupados as $materialId => $quantidade) {
            /** @var Material|null $material */
            $material = $materiais->get($materialId);

            if (! $material || $material->estoque_atual < $quantidade) {
                throw ValidationException::withMessages([
                    'itens' => 'Estoque insuficiente para realizar a entrega.',
                ]);
            }
        }

        $entregas = new Collection;

        foreach ($itensAgrupados as $materialId => $quantidade) {
            /** @var Material $material */
            $material = $materiais->get($materialId);
            $material->decrement('estoque_atual', $quantidade);

            $entregas->push(Entrega::create([
                ...$baseData,
                'material_id' => (int) $materialId,
                'quantidade' => $quantidade,
            ]));
        }

        return $entregas;
    }
}
