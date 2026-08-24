import { useCallback, useMemo } from 'react';
import { Button, Stack } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from 'dayjs';
import { useAuth } from '../../../auth/useAuth';
import {
  fetchRelatorioAcolhimentos,
  type RelatorioAcolhimentos,
  type RelatorioFiltros,
} from '../../../services/relatoriosService';
import { useRelatorio } from '../hooks/useRelatorio';
import { chartColors } from '../utils/chartColors';
import { toPdfTabela } from '../utils/exportHelpers';
import { ChartCard } from './ChartCard';
import { ReportStatCards } from './ReportStatCards';
import { ReportTable, type ReportColumn } from './ReportTable';
import {
  RelatorioError,
  RelatorioForbidden,
  RelatorioLoading,
} from './RelatorioStates';

const serieColumns: ReportColumn<RelatorioAcolhimentos['serie'][number]>[] = [
  { key: 'dia', label: 'Dia', value: (row) => dayjs(row.dia).format('DD/MM/YYYY') },
  { key: 'entradas', label: 'Entradas', align: 'right', value: (row) => row.entradas },
  { key: 'saidas', label: 'Saídas', align: 'right', value: (row) => row.saidas },
];

const motivosColumns: ReportColumn<{ motivo: string; total: number }>[] = [
  { key: 'motivo', label: 'Motivo da saída', value: (row) => row.motivo },
  { key: 'total', label: 'Total', align: 'right', value: (row) => row.total },
];

const condicoesColumns: ReportColumn<{ condicao: string; total: number }>[] = [
  { key: 'condicao', label: 'Condição na saída', value: (row) => row.condicao },
  { key: 'total', label: 'Total', align: 'right', value: (row) => row.total },
];

const encaminhamentosColumns: ReportColumn<{
  encaminhamento: string;
  total: number;
}>[] = [
  {
    key: 'encaminhamento',
    label: 'Encaminhamento de rede',
    value: (row) => row.encaminhamento,
  },
  { key: 'total', label: 'Total', align: 'right', value: (row) => row.total },
];

export function AcolhimentosTab({
  filtros,
  setorNome,
}: {
  filtros: RelatorioFiltros;
  setorNome?: string;
}) {
  const { user } = useAuth();
  const fetcher = useCallback(
    () => fetchRelatorioAcolhimentos(filtros),
    [filtros],
  );
  const { data, loading, error, forbidden, reload } = useRelatorio(fetcher);

  const grafico = useMemo(() => {
    if (!data) return null;
    const passo = Math.max(1, Math.ceil(data.serie.length / 10));
    return {
      dias: data.serie.map((ponto) => dayjs(ponto.dia).format('DD/MM')),
      entradas: data.serie.map((ponto) => ponto.entradas),
      saidas: data.serie.map((ponto) => ponto.saidas),
      passo,
    };
  }, [data]);

  if (forbidden) return <RelatorioForbidden />;
  if (loading) return <RelatorioLoading />;
  if (error || !data) return <RelatorioError onRetry={reload} />;

  const permanenciaLabel = data.permanencia
    ? `${data.permanencia.mediaDias} dias`
    : '—';

  const exportarPdf = async () => {
    const { openRelatorioPdf } = await import('../utils/relatorioPdf');
    await openRelatorioPdf({
      titulo: 'Relatório de acolhimentos',
      periodoLabel: `Período: ${dayjs(filtros.de).format('DD/MM/YYYY')} a ${dayjs(filtros.ate).format('DD/MM/YYYY')}`,
      filtroLabel: setorNome ? `Setor: ${setorNome}` : undefined,
      emissor: user?.name,
      stats: [
        { label: 'Entradas', value: data.totais.entradas },
        { label: 'Saídas', value: data.totais.saidas },
        { label: 'Permanência média', value: permanenciaLabel },
        {
          label: 'Permanência mín–máx',
          value: data.permanencia
            ? `${data.permanencia.minimoDias}–${data.permanencia.maximoDias} dias`
            : '—',
        },
      ],
      tabelas: [
        toPdfTabela('Entradas e saídas por dia', serieColumns, data.serie),
        toPdfTabela('Motivos de saída', motivosColumns, data.motivosSaida),
        toPdfTabela('Condição na saída', condicoesColumns, data.condicoesSaida),
        toPdfTabela(
          'Encaminhamentos de rede',
          encaminhamentosColumns,
          data.encaminhamentos,
        ),
      ],
      filename: `relatorio-acolhimentos-${filtros.de}-a-${filtros.ate}.pdf`,
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
            label: 'Entradas no período',
            value: data.totais.entradas,
            helper: 'Novos acolhimentos',
          },
          {
            label: 'Saídas no período',
            value: data.totais.saidas,
            helper: 'Desligamentos registrados',
          },
          {
            label: 'Permanência média',
            value: permanenciaLabel,
            helper: data.permanencia
              ? `Mediana: ${data.permanencia.medianaDias} dias`
              : 'Sem saídas no período',
          },
          {
            label: 'Permanência mín–máx',
            value: data.permanencia
              ? `${data.permanencia.minimoDias}–${data.permanencia.maximoDias}`
              : '—',
            helper: 'Em dias',
          },
        ]}
      />

      {grafico && (
        <ChartCard title="Entradas e saídas por dia">
          <BarChart
            height={280}
            xAxis={[
              {
                scaleType: 'band',
                data: grafico.dias,
                tickLabelInterval: (_value, index) =>
                  index % grafico.passo === 0,
              },
            ]}
            series={[
              {
                data: grafico.entradas,
                label: 'Entradas',
                color: chartColors.primaria,
              },
              {
                data: grafico.saidas,
                label: 'Saídas',
                color: chartColors.secundaria,
              },
            ]}
            grid={{ horizontal: true }}
          />
        </ChartCard>
      )}

      <ReportTable
        title="Entradas e saídas por dia"
        columns={serieColumns}
        rows={data.serie}
        rowKey={(row) => row.dia}
        csvFilename={`acolhimentos-serie-${filtros.de}-a-${filtros.ate}.csv`}
        maxHeight={280}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Stack sx={{ flex: 1 }} spacing={2}>
          <ReportTable
            title="Motivos de saída"
            columns={motivosColumns}
            rows={data.motivosSaida}
            rowKey={(row) => row.motivo}
            csvFilename={`acolhimentos-motivos-${filtros.de}-a-${filtros.ate}.csv`}
            emptyMessage="Nenhuma saída no período."
          />
          <ReportTable
            title="Condição na saída"
            columns={condicoesColumns}
            rows={data.condicoesSaida}
            rowKey={(row) => row.condicao}
            csvFilename={`acolhimentos-condicoes-${filtros.de}-a-${filtros.ate}.csv`}
            emptyMessage="Nenhuma saída no período."
          />
        </Stack>
        <Stack sx={{ flex: 1 }}>
          <ReportTable
            title="Encaminhamentos de rede"
            columns={encaminhamentosColumns}
            rows={data.encaminhamentos}
            rowKey={(row) => row.encaminhamento}
            csvFilename={`acolhimentos-encaminhamentos-${filtros.de}-a-${filtros.ate}.csv`}
            emptyMessage="Nenhum encaminhamento registrado no período."
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
