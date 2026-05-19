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
            ->select([
                'id', 'codigo_pulseira', 'nome', 'cpf', 'data_nascimento',
                'telefone', 'genero', 'leito', 'observacoes', 'pertences_registrados',
                'pcd', 'gestante', 'cronica', 'idoso',
                'familia_id', 'setor_id', 'data_entrada', 'hora_entrada', 'data_saida',
            ])
            ->whereNull('data_saida')
            ->with([
                'familia:id,codigo,responsavel_nome',
                'setor:id,nome,cor,capacidade,ativo',
            ])
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

    public function registrarSaida(Request $request, $id)
    {
        $acolhido = Acolhido::find($id);

        if (! $acolhido) {
            return response()->json(['error' => 'Acolhido não encontrado.'], 404);
        }

        $acolhido->status = 'desligado';

        $acolhido->data_saida = $request->input('data_saida');
        $acolhido->hora_saida = $request->input('hora_saida');
        $acolhido->tipo_desligamento = $request->input('tipo_desligamento');

        $acolhido->destino_informado = $request->input('destino_informado');
        $acolhido->endereco_destino = $request->input('endereco_destino');
        $acolhido->municipio_destino = $request->input('municipio_destino');
        $acolhido->telefone_destino = $request->input('telefone_destino');

        $acolhido->encaminhamentos_rede = $request->input('encaminhamentos_rede');
        $acolhido->resumo_encaminhamento = $request->input('resumo_encaminhamento');

        $acolhido->condicao_saida = $request->input('condicao_saida');
        $acolhido->observacoes_tecnicas = $request->input('observacoes_tecnicas');

        $acolhido->responsavel_desligamento = $request->input('responsavel_desligamento');
        $acolhido->cargo_responsavel = $request->input('cargo_responsavel');

        $acolhido->save();

        return response()->json([
            'message' => 'Ficha de saída salva',
        ]);
    }
}
