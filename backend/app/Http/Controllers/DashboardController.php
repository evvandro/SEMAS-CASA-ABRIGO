<?php

namespace App\Http\Controllers;

use App\Http\Resources\SetorResource;
use App\Models\Acolhido;
use App\Models\Entrega;
use App\Models\Familia;
use App\Models\Setor;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $familiasAtivas = Familia::query()->whereNull('data_saida')->count();
        $acolhidosAtivos = Acolhido::query()->whereNull('data_saida')->count();
        $entregasHoje = Entrega::query()->whereDate('data_entrega', now()->toDateString())->count();

        $setores = Setor::query()
            ->where('ativo', true)
            ->withCount([
                'familias as familias_ativas_count' => fn ($q) => $q->whereNull('data_saida'),
            ])
            ->orderBy('nome')
            ->get();

        return response()->json([
            'message' => 'Dashboard obtido com sucesso.',
            'data' => [
                'familias_ativas' => $familiasAtivas,
                'acolhidos_ativos' => $acolhidosAtivos,
                'entregas_hoje' => $entregasHoje,
                'setores' => $setores->map(function (Setor $setor) {
                    return [
                        ...((new SetorResource($setor))->toArray(request())),
                        'familias_ativas_count' => (int) ($setor->familias_ativas_count ?? 0),
                    ];
                })->values(),
            ],
        ]);
    }
}
