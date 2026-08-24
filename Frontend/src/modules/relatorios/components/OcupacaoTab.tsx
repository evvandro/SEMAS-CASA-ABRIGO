import { useCallback, useMemo } from 'react';
import { Box, Button, Stack } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { LineChart } from '@mui/x-charts/LineChart';
import dayjs from 'dayjs';
import { useAuth } from '../../../auth/useAuth';
import {
  fetchRelatorioOcupacao,
  type RelatorioFiltros,
  type RelatorioOcupacao,
  type RelatorioOcupacaoSetor,
} from '../../../services/relatoriosService';
import { useRelatorio } from '../hooks/useRelatorio';
import { chartColors } from '../utils/chartColors';
import { formatPercent, toPdfTabela } from '../utils/exportHelpers';
import { ChartCard } from './ChartCard';
import { ReportStatCards } from './ReportStatCards';
import { ReportTable, type ReportColumn } from './ReportTable';
import {
  RelatorioError,
  RelatorioForbidden,
  RelatorioLoading,
} from './RelatorioStates';

const atualColumns: ReportColumn<RelatorioOcupacaoSetor>[] = [
  { key: 'nome', label: 'Setor', value: (row) => row.nome },
  { key: 'capacidade', label: 'Capacidade', align: 'right', value: (row) => row.capacidade },
  {
    key: 'interditados',
    label: 'Leitos interditados',
    align: 'right',
    value: (row) => row.leitosInterditados,
  },
  { key: 'ocupados', label: 'Ocupados', align: 'right', value: (row) => row.ocupados },
  { key: 'livres', label: 'Livres', align: 'right', value: (row) => row.livres },
  {
    key: 'taxa',
    label: 'Ocupação',
    align: 'right',
    value: (row) => formatPercent(row.taxa),
  },
];

const historicoColumns: ReportColumn<RelatorioOcupacao['historico'][number]>[] = [
  { key: 'dia', label: 'Dia', value: (row) => dayjs(row.dia).format('DD/MM/YYYY') },
  { key: 'ocupados', label: 'Pessoas acolhidas', align: 'right', value: (row) => row.ocupados },
  { key: 'taxa', label: 'Ocupação', align: 'right', value: (row) => formatPercent(row.taxa) },
];

export function OcupacaoTab({
  filtros,
  setorNome,
}: {
  filtros: RelatorioFiltros;
  setorNome?: string;
}) {
  const { user } = useAuth();
  const fetcher = useCallback(() => fetchRelatorioOcupacao(filtros), [filtros]);
  const { data, loading, error, forbidden, reload } = useRelatorio(fetcher);

  const grafico = useMemo(() => {
    if (!data) return null;
    const passo = Math.max(1, Math.ceil(data.historico.length / 10));
    return {
      dias: data.historico.map((ponto) => dayjs(ponto.dia).format('DD/MM')),
      ocupados: data.historico.map((ponto) => ponto.ocupados),
      passo,
    };
  }, [data]);

  if (forbidden) return <RelatorioForbidden />;
  if (loading) return <RelatorioLoading />;
  if (error || !data) return <RelatorioError onRetry={reload} />;

  const ocupadosAgora = data.atual.reduce((acc, setor) => acc + setor.ocupados, 0);
  const taxaGeral =
    data.capacidadeDisponivel > 0
      ? ocupadosAgora / data.capacidadeDisponivel
      : null;
  const picoPeriodo = data.historico.reduce(
    (max, ponto) => Math.max(max, ponto.ocupados),
    0,
  );

  const exportarPdf = async () => {
    const { openRelatorioPdf } = await import('../utils/relatorioPdf');
    await openRelatorioPdf({
      titulo: 'Relatório de ocupação por setor',
      periodoLabel: `Período: ${dayjs(filtros.de).format('DD/MM/YYYY')} a ${dayjs(filtros.ate).format('DD/MM/YYYY')}`,
      filtroLabel: setorNome ? `Setor: ${setorNome}` : undefined,
      emissor: user?.name,
      stats: [
        { label: 'Ocupados hoje', value: ocupadosAgora },
        { label: 'Vagas úteis', value: data.capacidadeDisponivel },
        { label: 'Ocupação geral', value: formatPercent(taxaGeral) },
        { label: 'Pico no período', value: picoPeriodo },
      ],
      tabelas: [
        toPdfTabela('Ocupação atual por setor', atualColumns, data.atual),
        toPdfTabela(
          data.agregacao === 'semana'
            ? 'Histórico de ocupação (por semana)'
            : 'Histórico de ocupação (por dia)',
          historicoColumns,
          data.historico,
        ),
      ],
      filename: `relatorio-ocupacao-${filtros.de}-a-${filtros.ate}.pdf`,
    });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="flex-end">
        <Button
          size="small"
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => void exportarPdf()}
        >
          Exportar PDF
        </Button>
      </Stack>

      <ReportStatCards
        stats={[
          {
            label: 'Ocupados hoje',
            value: ocupadosAgora,
            helper: 'Pessoas ativas nos setores',
          },
          {
            label: 'Vagas úteis',
            value: data.capacidadeDisponivel,
            helper: 'Capacidade menos interditados',
          },
          {
            label: 'Ocupação geral',
            value: formatPercent(taxaGeral),
            helper: 'Sobre as vagas úteis',
          },
          {
            label: 'Pico no período',
            value: picoPeriodo,
            helper: 'Maior ocupação registrada',
          },
        ]}
      />

      {grafico && (
        <ChartCard
          title="Histórico de ocupação"
          subtitle={
            data.agregacao === 'semana'
              ? 'Agregado por semana (máximo de cada semana). Usa a capacidade atual dos setores.'
              : 'Pessoas acolhidas ao fim de cada dia. Usa a capacidade atual dos setores.'
          }
        >
          <LineChart
            height={280}
            xAxis={[
              {
                scaleType: 'point',
                data: grafico.dias,
                tickLabelInterval: (_value, index) =>
                  index % grafico.passo === 0,
              },
            ]}
            series={[
              {
                data: grafico.ocupados,
                label: 'Pessoas acolhidas',
                color: chartColors.primaria,
                showMark: false,
                curve: 'linear',
              },
            ]}
            hideLegend
            grid={{ horizontal: true }}
          />
        </ChartCard>
      )}

      <Box>
        <ReportTable
          title="Ocupação atual por setor"
          columns={atualColumns}
          rows={data.atual}
          rowKey={(row) => row.setorId}
          csvFilename={`ocupacao-setores-${filtros.ate}.csv`}
          emptyMessage="Nenhum setor ativo."
        />
      </Box>

      <ReportTable
        title={
          data.agregacao === 'semana'
            ? 'Histórico de ocupação (por semana)'
            : 'Histórico de ocupação (por dia)'
        }
        columns={historicoColumns}
        rows={data.historico}
        rowKey={(row) => row.dia}
        csvFilename={`ocupacao-historico-${filtros.de}-a-${filtros.ate}.csv`}
        maxHeight={280}
      />
    </Stack>
  );
}
