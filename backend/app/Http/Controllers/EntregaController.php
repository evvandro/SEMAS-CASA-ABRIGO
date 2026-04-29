<?php

namespace App\Http\Controllers;

use App\Http\Requests\Entregas\StoreEntregaRequest;
use App\Http\Resources\EntregaResource;
use App\Models\Entrega;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EntregaController extends Controller
{
    public function index(): JsonResponse
    {
        $entregas = Entrega::query()
            ->with(['material', 'familia', 'acolhido'])
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
            'data' => new EntregaResource($entrega->load(['material', 'familia', 'acolhido'])),
        ]);
    }

    public function store(StoreEntregaRequest $request): JsonResponse
    {
        $data = $request->validated();

        $entrega = DB::transaction(function () use ($data, $request) {
            /** @var Material $material */
            $material = Material::query()
                ->whereKey((int) $data['material_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $quantidade = (int) $data['quantidade'];

            if ($material->estoque_atual < $quantidade) {
                return response()->json([
                    'message' => 'Estoque insuficiente para realizar a entrega.',
                ], 422);
            }

            $material->decrement('estoque_atual', $quantidade);

            $entrega = Entrega::create([
                ...$data,
                'entregue_por' => $request->user()?->id,
            ]);

            return $entrega;
        });

        if ($entrega instanceof JsonResponse) {
            return $entrega;
        }

        $entrega->load(['material', 'familia', 'acolhido']);

        return response()->json([
            'message' => 'Entrega criada com sucesso.',
            'data' => new EntregaResource($entrega),
        ], 201);
    }
}
