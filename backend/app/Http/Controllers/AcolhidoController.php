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
use Illuminate\Support\Facades\DB;

class AcolhidoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Acolhido::query()
            ->select([
                'id', 'codigo_pulseira', 'nome', 'cpf', 'data_nascimento',
                'telefone', 'genero', 'leito', 'observacoes', 'pertences_registrados',
                'pcd', 'gestante', 'cronica', 'idoso',
                'familia_id', 'parentesco', 'setor_id', 'data_entrada', 'hora_entrada',
                'data_saida', 'hora_saida', 'tipo_saida', 'destino_informado', 'municipio_destino',
                'condicao_saida', 'responsavel_desligamento',
            ])
            ->when($request->get('status') === 'saida', fn ($q) => $q->whereNotNull('data_saida'), fn ($q) => $q->whereNull('data_saida'))
            ->with([
                'familia' => fn ($q) => $q
                    ->select(['id', 'codigo', 'responsavel_nome'])
                    ->withCount(['acolhidos as acolhidos_count' => fn ($sub) => $sub->whereNull('data_saida')]),
                'setor:id,nome,cor,capacidade,ativo',
            ])
            ->when($request->filled('setor_id'), fn ($q) => $q->where('setor_id', $request->integer('setor_id')))
            ->when($request->boolean('pcd'), fn ($q) => $q->where('pcd', true))
            ->when($request->boolean('gestante'), fn ($q) => $q->where('gestante', true))
            ->when($request->boolean('cronica'), fn ($q) => $q->where('cronica', true))
            ->when($request->boolean('idoso'), fn ($q) => $q->where('idoso', true))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = trim((string) $request->get('search'));

                $q->where(function ($sub) use ($search) {
                    $sub->where('nome', 'like', "%{$search}%")
                        ->orWhere('codigo_pulseira', 'like', "%{$search}%")
                        ->orWhere('cpf', 'like', "%{$search}%")
                        ->orWhereHas('familia', function ($familia) use ($search) {
                            $familia->where('codigo', 'like', "%{$search}%")
                                ->orWhere('responsavel_nome', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('nome');

        if ($request->filled('per_page')) {
            $perPage = min(max($request->integer('per_page', 25), 1), 100);
            $acolhidos = $query->paginate($perPage);

            return response()->json([
                'message' => 'Acolhidos listados com sucesso.',
                'data' => AcolhidoResource::collection($acolhidos->items()),
                'meta' => [
                    'current_page' => $acolhidos->currentPage(),
                    'last_page' => $acolhidos->lastPage(),
                    'per_page' => $acolhidos->perPage(),
                    'total' => $acolhidos->total(),
                ],
            ]);
        }

        $acolhidos = $query->get();
            ->when(
                $request->get('status') === 'saida',
                fn ($q) => $q->orderByDesc('data_saida')->orderByDesc('hora_saida')->orderBy('nome'),
                fn ($q) => $q->orderBy('nome'),
            )
            ->get();

        return response()->json([
            'message' => 'Acolhidos listados com sucesso.',
            'data' => AcolhidoResource::collection($acolhidos),
        ]);
    }

    public function show(Acolhido $acolhido): JsonResponse
    {
        $acolhido->load([
            'familia' => fn ($q) => $q->withCount(['acolhidos as acolhidos_count' => fn ($sub) => $sub->whereNull('data_saida')]),
            'setor',
        ]);

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

        return response()->json([
            'message' => 'Acolhido atualizado com sucesso.',
            'data' => new AcolhidoDetalheResource($acolhido->fresh()->load(['familia', 'setor'])),
        ]);
    }

    public function saida(RegistrarSaidaAcolhidoRequest $request, Acolhido $acolhido): JsonResponse
    {
        $acolhido->update($request->validated());

        return response()->json([
            'message' => 'Saida registrada com sucesso.',
            'data' => new AcolhidoDetalheResource($acolhido->fresh()->load(['familia', 'setor'])),
        ]);
        return DB::transaction(function () use ($request, $acolhido) {
            $validated = $request->validated();

            $acolhido->update($validated);

            if ($acolhido->familia_id) {
                $familia = $acolhido->familia()->lockForUpdate()->first();

                if ($familia && $familia->acolhidos()->whereNull('data_saida')->count() === 0) {
                    $familia->update($validated);
                }
            }

            return response()->json([
                'message' => 'Saida registrada com sucesso.',
                'data' => new AcolhidoDetalheResource($acolhido->fresh()->load(['familia', 'setor'])),
            ]);
        });
    }

    public function registrarSaida(RegistrarSaidaAcolhidoRequest $request, Acolhido $acolhido): JsonResponse
    {
        return $this->saida($request, $acolhido);
    }
}
