<?php

namespace App\Http\Controllers;

use App\Http\Requests\Acolhidos\RegistrarSaidaAcolhidoRequest;
use App\Http\Requests\Acolhidos\StoreAcolhidoRequest;
use App\Http\Requests\Acolhidos\UpdateAcolhidoRequest;
use App\Http\Resources\AcolhidoDetalheResource;
use App\Http\Resources\AcolhidoResource;
use App\Models\Acolhido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcolhidoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $acolhidos = Acolhido::query()
            ->whereNull('data_saida')
            ->with(['familia', 'setor'])
            ->when($request->filled('setor_id'), fn ($q) => $q->where('setor_id', (int) $request->get('setor_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = (string) $request->get('search');
                $q->where(function ($sub) use ($search) {
                    $sub->where('nome', 'like', "%{$search}%")
                        ->orWhere('codigo_pulseira', 'like', "%{$search}%")
                        ->orWhere('cpf', 'like', "%{$search}%");
                });
            })
            ->orderBy('nome')
            ->get();

        return response()->json([
            'message' => 'Acolhidos listados com sucesso.',
            'data' => AcolhidoResource::collection($acolhidos),
        ]);
    }

    public function show(Acolhido $acolhido): JsonResponse
    {
        $acolhido->load(['familia', 'setor']);

        return response()->json([
            'message' => 'Acolhido obtido com sucesso.',
            'data' => new AcolhidoDetalheResource($acolhido),
        ]);
    }

    public function store(StoreAcolhidoRequest $request): JsonResponse
    {
        $acolhido = Acolhido::create($request->validated());

        $acolhido->load(['familia', 'setor']);

        return response()->json([
            'message' => 'Acolhido criado com sucesso.',
            'data' => new AcolhidoDetalheResource($acolhido),
        ], 201);
    }

    public function update(UpdateAcolhidoRequest $request, Acolhido $acolhido): JsonResponse
    {
        $acolhido->update($request->validated());

        $acolhido->load(['familia', 'setor']);

        return response()->json([
            'message' => 'Acolhido atualizado com sucesso.',
            'data' => new AcolhidoDetalheResource($acolhido->fresh()->load(['familia', 'setor'])),
        ]);
    }

    public function saida(RegistrarSaidaAcolhidoRequest $request, Acolhido $acolhido): JsonResponse
    {
        $acolhido->update($request->validated());

        return response()->json([
            'message' => 'Saída registrada com sucesso.',
            'data' => new AcolhidoDetalheResource($acolhido->fresh()->load(['familia', 'setor'])),
        ]);
    }
}
