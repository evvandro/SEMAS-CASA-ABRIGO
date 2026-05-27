<?php

namespace App\Http\Controllers;

use App\Http\Requests\Setores\StoreSetorRequest;
use App\Http\Requests\Setores\UpdateSetorRequest;
use App\Http\Resources\SetorResource;
use App\Models\Setor;
use Illuminate\Http\JsonResponse;

class SetorController extends Controller
{
    public function index(): JsonResponse
    {
        $setores = Setor::query()
            ->orderBy('nome')
            ->get();

        return response()->json([
            'message' => 'Setores listados com sucesso.',
            'data' => SetorResource::collection($setores),
        ]);
    }

    public function store(StoreSetorRequest $request): JsonResponse
    {
        $setor = Setor::create([
            ...$request->validated(),
            'ativo' => true,
        ]);

        return response()->json([
            'message' => 'Setor criado com sucesso.',
            'data' => new SetorResource($setor),
        ], 201);
    }

    public function update(UpdateSetorRequest $request, Setor $setor): JsonResponse
    {
        $setor->update($request->validated());

        return response()->json([
            'message' => 'Setor atualizado com sucesso.',
            'data' => new SetorResource($setor->fresh()),
        ]);
    }

    public function destroy(Setor $setor): JsonResponse
    {
        if ($setor->acolhidos()->where('ativo', true)->exists()) {
            return response()->json([
                'message' => 'Setor possui acolhidos ativos e não pode ser removido.',
            ], 422);
        }

        $setor->delete();

        return response()->json([
            'message' => 'Setor removido com sucesso.',
        ]);
    }
}
