<?php

namespace App\Http\Controllers;

use App\Http\Requests\Familias\RegistrarSaidaFamiliaRequest;
use App\Http\Requests\Familias\StoreFamiliaRequest;
use App\Http\Requests\Familias\UpdateFamiliaRequest;
use App\Http\Resources\FamiliaDetalheResource;
use App\Http\Resources\FamiliaResource;
use App\Models\Acolhido;
use App\Models\Familia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FamiliaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $familias = Familia::query()
            ->when($request->get('status') === 'saida', fn ($q) => $q->whereNotNull('data_saida'), fn ($q) => $q->whereNull('data_saida'))
            ->with('setor')
            ->withCount([
                'acolhidos as acolhidos_count' => fn ($q) => $request->get('status') === 'saida' ? $q : $q->whereNull('data_saida'),
            ])
            ->when($request->filled('setor_id'), fn ($q) => $q->where('setor_id', (int) $request->get('setor_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = (string) $request->get('search');
                $q->where(function ($sub) use ($search) {
                    $sub->where('codigo', 'like', "%{$search}%")
                        ->orWhere('responsavel_nome', 'like', "%{$search}%");
                });
            })
            ->when(
                $request->get('status') === 'saida',
                fn ($q) => $q->orderByDesc('data_saida')->orderByDesc('hora_saida'),
                fn ($q) => $q->orderBy('responsavel_nome')->orderByDesc('id'),
            )
            ->get();

        return response()->json([
            'message' => 'Famílias listadas com sucesso.',
            'data' => FamiliaResource::collection($familias),
        ]);
    }

    public function store(StoreFamiliaRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $acolhidosData = $validated['acolhidos'] ?? [];
            unset($validated['acolhidos']);

            $familia = Familia::create($validated);

            foreach ($acolhidosData as $acolhidoData) {
                if (empty($acolhidoData['codigo_pulseira'])) {
                    $acolhidoData['codigo_pulseira'] = Acolhido::gerarCodigoPulseira();
                }
                $acolhidoData['familia_id'] = $familia->id;
                $acolhidoData['setor_id'] = $familia->setor_id;
                $acolhidoData['data_entrada'] = $familia->data_entrada;

                Acolhido::create($acolhidoData);
            }

            $familia->load('setor');
            $familia->loadCount([
                'acolhidos as acolhidos_count' => fn ($q) => $q->whereNull('data_saida'),
            ]);

            return response()->json([
                'message' => 'Família criada com sucesso.',
                'data' => new FamiliaDetalheResource($familia),
            ], 201);
        });
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
        return DB::transaction(function () use ($request, $familia) {
            $validated = $request->validated();
            $familia->update($validated);

            $familia->acolhidos()->whereNull('data_saida')->update([
                'data_saida' => $validated['data_saida'] ?? now(),
                'hora_saida' => $validated['hora_saida'] ?? null,
                'tipo_saida' => $validated['tipo_saida'] ?? null,
                'destino_informado' => $validated['destino_informado'] ?? null,
                'endereco_destino' => $validated['endereco_destino'] ?? null,
                'municipio_destino' => $validated['municipio_destino'] ?? null,
                'telefone_destino' => $validated['telefone_destino'] ?? null,
                'encaminhamentos_rede' => isset($validated['encaminhamentos_rede']) ? json_encode($validated['encaminhamentos_rede']) : null,
                'resumo_encaminhamento' => $validated['resumo_encaminhamento'] ?? null,
                'condicao_saida' => $validated['condicao_saida'] ?? null,
                'observacoes_tecnicas' => $validated['observacoes_tecnicas'] ?? null,
                'responsavel_desligamento' => $validated['responsavel_desligamento'] ?? null,
                'cargo_responsavel' => $validated['cargo_responsavel'] ?? null,
            ]);

            $familia->load('setor');
            $familia->loadCount([
                'acolhidos as acolhidos_count' => fn ($q) => $q->whereNull('data_saida'),
            ]);

            return response()->json([
                'message' => 'Saída registrada com sucesso para todos os membros.',
                'data' => new FamiliaDetalheResource($familia->fresh()->load('setor')),
            ]);
        });
    }
}
