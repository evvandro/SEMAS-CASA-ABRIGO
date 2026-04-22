<?php

namespace App\Http\Controllers;

use App\Http\Requests\Materiais\StoreMaterialRequest;
use App\Http\Requests\Materiais\UpdateMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Material;
use Illuminate\Http\JsonResponse;

class MaterialController extends Controller
{
    public function index(): JsonResponse
    {
        $materiais = Material::query()
            ->orderBy('nome')
            ->get();

        return response()->json([
            'message' => 'Materiais listados com sucesso.',
            'data' => MaterialResource::collection($materiais),
        ]);
    }

    public function show(Material $material): JsonResponse
    {
        return response()->json([
            'message' => 'Material obtido com sucesso.',
            'data' => new MaterialResource($material),
        ]);
    }

    public function store(StoreMaterialRequest $request): JsonResponse
    {
        $material = Material::create($request->validated());

        return response()->json([
            'message' => 'Material criado com sucesso.',
            'data' => new MaterialResource($material),
        ], 201);
    }

    public function update(UpdateMaterialRequest $request, Material $material): JsonResponse
    {
        $material->update($request->validated());

        return response()->json([
            'message' => 'Material atualizado com sucesso.',
            'data' => new MaterialResource($material->fresh()),
        ]);
    }

    public function destroy(Material $material): JsonResponse
    {
        $material->delete();

        return response()->json([
            'message' => 'Material removido com sucesso.',
        ]);
    }
}
