<?php

namespace App\Http\Controllers;

use App\Http\Requests\Relatorios\RelatorioPerfilRequest;
use App\Http\Requests\Relatorios\RelatorioPeriodoRequest;
use App\Models\Acolhido;
use App\Models\Entrega;
use App\Models\Material;
use App\Models\Setor;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RelatorioController extends Controller
{
    public function acolhimentos(RelatorioPeriodoRequest $request): JsonResponse
    {
        [$de, $ate] = $request->periodo();
        $setorId = $request->setorId();

        $entradasPorDia = $this->contagemPorDia(
            $this->acolhidosDoSetor($setorId), 'data_entrada', $de, $ate
        );
        $saidasPorDia = $this->contagemPorDia(
            $this->acolhidosDoSetor($setorId), 'data_saida', $de, $ate
        );

        $motivos = $this->acolhidosDoSetor($setorId)
            ->whereDate('data_saida', '>=', $de)
            ->whereDate('data_saida', '<=', $ate)
            ->selectRaw("COALESCE(tipo_saida, 'Nao informado') as motivo, COUNT(*) as total")
            ->groupBy('motivo')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($linha) => ['motivo' => $linha->motivo, 'total' => (int) $linha->total])
            ->values();

        $condicoes = $this->acolhidosDoSetor($setorId)
            ->whereDate('data_saida', '>=', $de)
            ->whereDate('data_saida', '<=', $ate)
            ->selectRaw("COALESCE(condicao_saida, 'Nao informado') as condicao, COUNT(*) as total")
            ->groupBy('condicao')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($linha) => ['condicao' => $linha->condicao, 'total' => (int) $linha->total])
            ->values();

        // Conjunto pequeno (apenas saídas do período, 2 colunas + JSON): a aritmética de
        // datas e a tabulação do JSON ficam em PHP porque DATEDIFF e funções JSON não são
        // portáveis entre SQLite (testes) e PostgreSQL (produção).
        $saidas = $this->acolhidosDoSetor($setorId)
            ->whereDate('data_saida', '>=', $de)
            ->whereDate('data_saida', '<=', $ate)
            ->get(['data_entrada', 'data_saida', 'encaminhamentos_rede']);

        $duracoes = $saidas
            ->filter(fn (Acolhido $a) => $a->data_entrada !== null && $a->data_saida !== null)
            ->map(fn (Acolhido $a) => (int) $a->data_entrada->diffInDays($a->data_saida))
            ->sort()
            ->values();

        $permanencia = $duracoes->isEmpty() ? null : [
            'media_dias' => round((float) $duracoes->avg(), 1),
            'mediana_dias' => (float) $duracoes->median(),
            'minimo_dias' => $duracoes->first(),
            'maximo_dias' => $duracoes->last(),
        ];

        $encaminhamentos = $saidas
            ->flatMap(fn (Acolhido $a) => is_array($a->encaminhamentos_rede) ? $a->encaminhamentos_rede : [])
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn (string $item) => $item !== '')
            ->countBy()
            ->sortDesc()
            ->map(fn (int $total, string $encaminhamento) => [
                'encaminhamento' => $encaminhamento,
                'total' => $total,
            ])
            ->values();

        return response()->json([
            'message' => 'Relatório de acolhimentos gerado com sucesso.',
            'data' => [
                'periodo' => ['de' => $de, 'ate' => $ate],
                'totais' => [
                    'entradas' => array_sum($entradasPorDia),
                    'saidas' => array_sum($saidasPorDia),
                ],
                'serie' => $this->montarSerie($de, $ate, [
                    'entradas' => $entradasPorDia,
                    'saidas' => $saidasPorDia,
                ]),
                'motivos_saida' => $motivos,
                'condicoes_saida' => $condicoes,
                'permanencia' => $permanencia,
                'encaminhamentos' => $encaminhamentos,
            ],
        ]);
    }

    public function ocupacao(RelatorioPeriodoRequest $request): JsonResponse
    {
        [$de, $ate] = $request->periodo();
        $setorId = $request->setorId();

        $setores = Setor::query()
            ->where('ativo', true)
            ->when($setorId !== null, fn ($q) => $q->where('id', $setorId))
            ->withCount([
                'acolhidos as ocupados_count' => fn ($q) => $q->whereNull('data_saida'),
            ])
            ->orderBy('nome')
            ->get();

        $atual = $setores->map(function (Setor $setor) {
            $interditados = count($setor->leitos_interditados ?? []);
            $disponiveis = max(0, (int) ($setor->capacidade ?? 0) - $interditados);
            $ocupados = (int) ($setor->ocupados_count ?? 0);

            return [
                'setor_id' => $setor->id,
                'nome' => $setor->nome,
                'cor' => $setor->cor,
                'capacidade' => (int) ($setor->capacidade ?? 0),
                'leitos_interditados' => $interditados,
                'ocupados' => $ocupados,
                'livres' => max(0, $disponiveis - $ocupados),
                'taxa' => $disponiveis > 0 ? round($ocupados / $disponiveis, 3) : null,
            ];
        })->values();

        $capacidadeDisponivel = $atual->sum(fn (array $linha) => max(0, $linha['capacidade'] - $linha['leitos_interditados']));

        // Ocupação histórica derivada por running total (sem tabela de snapshot):
        // ocupação no instante inicial + entradas/saídas por dia acumuladas em PHP.
        // Limitação documentada: usa a capacidade/interdições atuais dos setores.
        $inicial = $this->acolhidosDoSetor($setorId)
            ->whereDate('data_entrada', '<', $de)
            ->where(fn ($q) => $q->whereNull('data_saida')->orWhereDate('data_saida', '>=', $de))
            ->count();

        $entradasPorDia = $this->contagemPorDia($this->acolhidosDoSetor($setorId), 'data_entrada', $de, $ate);
        $saidasPorDia = $this->contagemPorDia($this->acolhidosDoSetor($setorId), 'data_saida', $de, $ate);

        $historico = [];
        $ocupacao = $inicial;
        $cursor = Carbon::parse($de);
        $fim = Carbon::parse($ate);

        while ($cursor->lte($fim)) {
            $dia = $cursor->toDateString();
            $ocupacao += ($entradasPorDia[$dia] ?? 0) - ($saidasPorDia[$dia] ?? 0);
            $historico[] = [
                'dia' => $dia,
                'ocupados' => $ocupacao,
                'taxa' => $capacidadeDisponivel > 0 ? round($ocupacao / $capacidadeDisponivel, 3) : null,
            ];
            $cursor->addDay();
        }

        $agregacao = 'dia';

        if (count($historico) > 92) {
            $agregacao = 'semana';
            $historico = collect($historico)
                ->chunk(7)
                ->map(function ($semana) use ($capacidadeDisponivel) {
                    $ocupados = (int) $semana->max('ocupados');

                    return [
                        'dia' => $semana->first()['dia'],
                        'ocupados' => $ocupados,
                        'taxa' => $capacidadeDisponivel > 0 ? round($ocupados / $capacidadeDisponivel, 3) : null,
                    ];
                })
                ->values()
                ->all();
        }

        return response()->json([
            'message' => 'Relatório de ocupação gerado com sucesso.',
            'data' => [
                'periodo' => ['de' => $de, 'ate' => $ate],
                'atual' => $atual,
                'capacidade_disponivel' => $capacidadeDisponivel,
                'historico' => $historico,
                'agregacao' => $agregacao,
            ],
        ]);
    }

    public function estoque(RelatorioPeriodoRequest $request): JsonResponse
    {
        [$de, $ate] = $request->periodo();

        $recebidosPorMaterial = DB::table('recebimento_material_itens as i')
            ->join('recebimentos_materiais as r', 'r.id', '=', 'i.recebimento_material_id')
            ->leftJoin('materiais as m', 'm.id', '=', 'i.material_id')
            ->whereDate('r.data_recebimento', '>=', $de)
            ->whereDate('r.data_recebimento', '<=', $ate)
            ->selectRaw('i.material_id, COALESCE(m.nome, i.descricao) as nome, SUM(i.quantidade) as total')
            ->groupBy('i.material_id', 'nome')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($linha) => [
                'material_id' => $linha->material_id !== null ? (int) $linha->material_id : null,
                'nome' => $linha->nome,
                'total' => (int) $linha->total,
            ])
            ->values();

        $recebimentosPorOrigem = DB::table('recebimentos_materiais as r')
            ->join('recebimento_material_itens as i', 'i.recebimento_material_id', '=', 'r.id')
            ->whereDate('r.data_recebimento', '>=', $de)
            ->whereDate('r.data_recebimento', '<=', $ate)
            ->selectRaw('r.origem, COUNT(DISTINCT r.id) as recebimentos, SUM(i.quantidade) as itens')
            ->groupBy('r.origem')
            ->orderByDesc('itens')
            ->get()
            ->map(fn ($linha) => [
                'origem' => $linha->origem,
                'recebimentos' => (int) $linha->recebimentos,
                'itens' => (int) $linha->itens,
            ])
            ->values();

        $entregasPorDestino = Entrega::query()
            ->whereDate('data_entrega', '>=', $de)
            ->whereDate('data_entrega', '<=', $ate)
            ->selectRaw("COALESCE(destino_tipo, 'nao_informado') as destino, COUNT(*) as registros, SUM(quantidade) as itens")
            ->groupBy('destino')
            ->orderByDesc('itens')
            ->get()
            ->map(fn ($linha) => [
                'destino' => $linha->destino,
                'registros' => (int) $linha->registros,
                'itens' => (int) $linha->itens,
            ])
            ->values();

        $entregasPorMaterial = Entrega::query()
            ->join('materiais as m', 'm.id', '=', 'entregas.material_id')
            ->whereDate('entregas.data_entrega', '>=', $de)
            ->whereDate('entregas.data_entrega', '<=', $ate)
            ->selectRaw('entregas.material_id, m.nome, COUNT(*) as registros, SUM(entregas.quantidade) as total')
            ->groupBy('entregas.material_id', 'm.nome')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($linha) => [
                'material_id' => (int) $linha->material_id,
                'nome' => $linha->nome,
                'registros' => (int) $linha->registros,
                'total' => (int) $linha->total,
            ])
            ->values();

        $entreguesPorDia = Entrega::query()
            ->whereDate('data_entrega', '>=', $de)
            ->whereDate('data_entrega', '<=', $ate)
            ->selectRaw('data_entrega as dia, SUM(quantidade) as total')
            ->groupBy('dia')
            ->pluck('total', 'dia')
            ->mapWithKeys(fn ($total, $dia) => [substr((string) $dia, 0, 10) => (int) $total])
            ->all();

        $recebidosPorDia = DB::table('recebimento_material_itens as i')
            ->join('recebimentos_materiais as r', 'r.id', '=', 'i.recebimento_material_id')
            ->whereDate('r.data_recebimento', '>=', $de)
            ->whereDate('r.data_recebimento', '<=', $ate)
            ->selectRaw('r.data_recebimento as dia, SUM(i.quantidade) as total')
            ->groupBy('dia')
            ->pluck('total', 'dia')
            ->mapWithKeys(fn ($total, $dia) => [substr((string) $dia, 0, 10) => (int) $total])
            ->all();

        $saldo = Material::query()
            ->where('ativo', true)
            ->orderBy('nome')
            ->get(['id', 'nome', 'categoria', 'unidade', 'estoque_atual']);

        return response()->json([
            'message' => 'Relatório de estoque gerado com sucesso.',
            'data' => [
                'periodo' => ['de' => $de, 'ate' => $ate],
                'totais' => [
                    'itens_recebidos' => array_sum($recebidosPorDia),
                    'itens_entregues' => array_sum($entreguesPorDia),
                ],
                'serie' => $this->montarSerie($de, $ate, [
                    'recebidos' => $recebidosPorDia,
                    'entregues' => $entreguesPorDia,
                ]),
                'recebidos_por_material' => $recebidosPorMaterial,
                'recebimentos_por_origem' => $recebimentosPorOrigem,
                'entregas_por_destino' => $entregasPorDestino,
                'entregas_por_material' => $entregasPorMaterial,
                'saldo_atual' => $saldo,
            ],
        ]);
    }

    public function perfil(RelatorioPerfilRequest $request): JsonResponse
    {
        $referencia = $request->dataReferencia();
        $setorId = $request->setorId();

        $base = fn (): Builder => $this->acolhidosDoSetor($setorId)
            ->whereDate('data_entrada', '<=', $referencia)
            ->where(fn ($q) => $q->whereNull('data_saida')->orWhereDate('data_saida', '>', $referencia));

        $total = $base()->count();

        // Datas-limite calculadas em PHP e formatadas com hora zerada: comparação
        // idêntica no PostgreSQL (literal coagido para date) e no SQLite dos testes
        // (colunas date são armazenadas como 'Y-m-d H:i:s' pelo Eloquent).
        $ref = Carbon::parse($referencia);
        $limites = collect([12, 18, 30, 60])
            ->map(fn (int $anos) => $ref->copy()->subYears($anos)->format('Y-m-d 00:00:00'))
            ->all();

        $faixasBrutas = $base()
            ->selectRaw("CASE
                WHEN data_nascimento IS NULL THEN 'sem_data'
                WHEN data_nascimento > ? THEN '0-11'
                WHEN data_nascimento > ? THEN '12-17'
                WHEN data_nascimento > ? THEN '18-29'
                WHEN data_nascimento > ? THEN '30-59'
                ELSE '60+' END as faixa, COUNT(*) as total", $limites)
            ->groupBy('faixa')
            ->pluck('total', 'faixa');

        $faixasEtarias = collect(['0-11', '12-17', '18-29', '30-59', '60+', 'sem_data'])
            ->map(fn (string $faixa) => [
                'faixa' => $faixa,
                'total' => (int) ($faixasBrutas[$faixa] ?? 0),
            ])
            ->values();

        $genero = $base()
            ->selectRaw("COALESCE(genero, 'nao_informado') as genero, COUNT(*) as total")
            ->groupBy('genero')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($linha) => [
                'genero' => $linha->genero === '' ? 'nao_informado' : $linha->genero,
                'total' => (int) $linha->total,
            ])
            ->values();

        // 4 counts separados: binding booleano do Eloquent é portável entre drivers
        // (SUM(CASE) raw divergiria entre boolean do PG e integer do SQLite).
        $saude = [
            'pcd' => $base()->where('pcd', true)->count(),
            'gestante' => $base()->where('gestante', true)->count(),
            'cronica' => $base()->where('cronica', true)->count(),
            'idoso' => $base()->where('idoso', true)->count(),
        ];

        $porSetor = $base()
            ->join('setores', 'setores.id', '=', 'acolhidos.setor_id')
            ->selectRaw('acolhidos.setor_id, setores.nome, COUNT(*) as total')
            ->groupBy('acolhidos.setor_id', 'setores.nome')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($linha) => [
                'setor_id' => (int) $linha->setor_id,
                'nome' => $linha->nome,
                'total' => (int) $linha->total,
            ])
            ->values();

        return response()->json([
            'message' => 'Relatório de perfil gerado com sucesso.',
            'data' => [
                'data_referencia' => $referencia,
                'total' => $total,
                'faixas_etarias' => $faixasEtarias,
                'genero' => $genero,
                'saude' => $saude,
                'por_setor' => $porSetor,
            ],
        ]);
    }

    private function acolhidosDoSetor(?int $setorId): Builder
    {
        return Acolhido::query()
            ->when($setorId !== null, fn ($q) => $q->where('setor_id', $setorId));
    }

    /**
     * Conta registros por dia de $coluna dentro do período, com chaves normalizadas
     * para Y-m-d (o SQLite devolve 'Y-m-d H:i:s' e o PostgreSQL 'Y-m-d').
     *
     * @return array<string, int>
     */
    private function contagemPorDia(Builder $query, string $coluna, string $de, string $ate): array
    {
        return $query
            ->whereDate($coluna, '>=', $de)
            ->whereDate($coluna, '<=', $ate)
            ->selectRaw("{$coluna} as dia, COUNT(*) as total")
            ->groupBy('dia')
            ->pluck('total', 'dia')
            ->mapWithKeys(fn ($total, $dia) => [substr((string) $dia, 0, 10) => (int) $total])
            ->all();
    }

    /**
     * Monta a série diária do período combinando mapas dia => total por métrica.
     *
     * @param  array<string, array<string, int>>  $metricas
     * @return list<array<string, int|string>>
     */
    private function montarSerie(string $de, string $ate, array $metricas): array
    {
        $serie = [];
        $cursor = Carbon::parse($de);
        $fim = Carbon::parse($ate);

        while ($cursor->lte($fim)) {
            $dia = $cursor->toDateString();
            $ponto = ['dia' => $dia];

            foreach ($metricas as $nome => $porDia) {
                $ponto[$nome] = $porDia[$dia] ?? 0;
            }

            $serie[] = $ponto;
            $cursor->addDay();
        }

        return $serie;
    }
}
