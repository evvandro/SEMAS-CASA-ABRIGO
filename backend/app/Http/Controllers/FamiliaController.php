<?php

namespace App\Http\Controllers;

use App\Http\Requests\Familias\RegistrarSaidaFamiliaRequest;
use App\Http\Requests\Familias\StoreFamiliaRequest;
use App\Http\Requests\Familias\UpdateFamiliaRequest;
use App\Http\Resources\FamiliaDetalheResource;
use App\Http\Resources\FamiliaResource;
use App\Models\Familia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FamiliaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $familias = Familia::query()
            ->whereNull('data_saida')
            ->with('setor')
            ->withCount([
                'acolhidos as acolhidos_count' => fn ($q) => $q->whereNull('data_saida'),
            ])
            ->when($request->filled('setor_id'), fn ($q) => $q->where('setor_id', (int) $request->get('setor_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = (string) $request->get('search');
                $q->where(function ($sub) use ($search) {
                    $sub->where('codigo', 'like', "%{$search}%")
                        ->orWhere('responsavel_nome', 'like', "%{$search}%");
                });
            })
            ->orderBy('responsavel_nome')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'message' => 'Famílias listadas com sucesso.',
            'data' => FamiliaResource::collection($familias),
        ]);
    }

    public function store(StoreFamiliaRequest $request): JsonResponse
    {
        $familia = Familia::create($request->validated());

        $familia->load('setor');
        $familia->loadCount([
            'acolhidos as acolhidos_count' => fn ($q) => $q->whereNull('data_saida'),
        ]);

        return response()->json([
            'message' => 'Família criada com sucesso.',
            'data' => new FamiliaDetalheResource($familia),
        ], 201);
    }

    public function show(Familia $familia): JsonResponse
    {
        $familia->load([
            'setor',
            'acolhidos' => fn ($q) => $q->orderBy('nome'),
        ]);

        $familia->loadCount([
            'acolhidos as acolhidos_count' => fn ($q) => $q->whereNull('data_saida'),
        ]);

        return response()->json([
            'message' => 'Família obtida com sucesso.',
            'data' => new FamiliaDetalheResource($familia),
        ]);
    }

    public function update(UpdateFamiliaRequest $request, Familia $familia): JsonResponse
    {
        $familia->update($request->validated());
        $familia->load('setor');
        $familia->loadCount([
            'acolhidos as acolhidos_count' => fn ($q) => $q->whereNull('data_saida'),
        ]);

        return response()->json([
            'message' => 'Família atualizada com sucesso.',
            'data' => new FamiliaDetalheResource($familia->fresh()->load('setor')),
        ]);
    }

    public function saida(RegistrarSaidaFamiliaRequest $request, Familia $familia): JsonResponse
    {
        $familia->update($request->validated());

        $familia->load('setor');
        $familia->loadCount([
            'acolhidos as acolhidos_count' => fn ($q) => $q->whereNull('data_saida'),
        ]);

        return response()->json([
            'message' => 'Saída registrada com sucesso.',
            'data' => new FamiliaDetalheResource($familia->fresh()->load('setor')),
        ]);
    }
}
