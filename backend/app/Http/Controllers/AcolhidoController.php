<?php

namespace App\Http\Controllers;

use App\Http\Requests\Acolhidos\StoreAcolhidoRequest;
use App\Http\Requests\Acolhidos\UpdateAcolhidoRequest;
use App\Http\Resources\AcolhidoResource;
use App\Models\Acolhido;
use Illuminate\Http\JsonResponse;

class AcolhidoController extends Controller
{
    public function index(): JsonResponse
    {
        $acolhidos = Acolhido::query()
            ->orderBy('nome')
            ->get();

        return response()->json([
            'message' => 'Acolhidos listados com sucesso.',
            'data' => AcolhidoResource::collection($acolhidos),
        ]);
    }

    public function show(Acolhido $acolhido): JsonResponse
    {
        return response()->json([
            'message' => 'Acolhido obtido com sucesso.',
            'data' => new AcolhidoResource($acolhido),
        ]);
    }

    public function store(StoreAcolhidoRequest $request): JsonResponse
    {
        $acolhido = Acolhido::create($request->validated());

        return response()->json([
            'message' => 'Acolhido criado com sucesso.',
            'data' => new AcolhidoResource($acolhido),
        ], 201);
    }

    public function update(UpdateAcolhidoRequest $request, Acolhido $acolhido): JsonResponse
    {
        $acolhido->update($request->validated());

        return response()->json([
            'message' => 'Acolhido atualizado com sucesso.',
            'data' => new AcolhidoResource($acolhido->fresh()),
        ]);
    }

    public function destroy(Acolhido $acolhido): JsonResponse
    {
        $acolhido->delete();

        return response()->json([
            'message' => 'Acolhido removido com sucesso.',
        ]);
    }
}
