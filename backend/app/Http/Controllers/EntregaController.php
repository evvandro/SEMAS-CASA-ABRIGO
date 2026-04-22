<?php

namespace App\Http\Controllers;

use App\Http\Requests\Entregas\StoreEntregaRequest;
use App\Http\Requests\Entregas\UpdateEntregaRequest;
use App\Http\Resources\EntregaResource;
use App\Models\Entrega;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EntregaController extends Controller
{
    public function index(): JsonResponse
    {
        $entregas = Entrega::query()
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
            'data' => new EntregaResource($entrega),
        ]);
    }

    public function store(StoreEntregaRequest $request): JsonResponse
    {
        $data = $request->validated();

        $data['entregue_por'] = $request->user()?->id;

        $entrega = Entrega::create($data);

        return response()->json([
            'message' => 'Entrega criada com sucesso.',
            'data' => new EntregaResource($entrega),
        ], 201);
    }

    public function update(UpdateEntregaRequest $request, Entrega $entrega): JsonResponse
    {
        $entrega->update($request->validated());

        return response()->json([
            'message' => 'Entrega atualizada com sucesso.',
            'data' => new EntregaResource($entrega->fresh()),
        ]);
    }

    public function destroy(Request $request, Entrega $entrega): JsonResponse
    {
        $entrega->delete();

        return response()->json([
            'message' => 'Entrega removida com sucesso.',
        ]);
    }
}
