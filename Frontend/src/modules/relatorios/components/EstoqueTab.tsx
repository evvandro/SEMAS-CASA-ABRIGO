import { useCallback, useMemo } from 'react';
import { Button, Stack } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { LineChart } from '@mui/x-charts/LineChart';
import dayjs from 'dayjs';
import { useAuth } from '../../../auth/useAuth';
import {
  fetchRelatorioEstoque,
  type RelatorioEstoque,
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

const DESTINO_LABELS: Record<string, string> = {
  familia: 'Família',
  acolhido: 'Acolhido',
  externo: 'Externo',
  nao_informado: 'Não informado',
};

const recebidosColumns: ReportColumn<
  RelatorioEstoque['recebidosPorMaterial'][number]
>[] = [
  { key: 'nome', label: 'Material', value: (row) => row.nome },
  { key: 'total', label: 'Itens recebidos', align: 'right', value: (row) => row.total },
];

const origemColumns: ReportColumn<
  RelatorioEstoque['recebimentosPorOrigem'][number]
>[] = [
  { key: 'origem', label: 'Origem', value: (row) => row.origem },
  { key: 'recebimentos', label: 'Recebimentos', align: 'right', value: (row) => row.recebimentos },
  { key: 'itens', label: 'Itens', align: 'right', value: (row) => row.itens },
];

const destinoColumns: ReportColumn<
  RelatorioEstoque['entregasPorDestino'][number]
>[] = [
  {
    key: 'destino',
    label: 'Destino',
    value: (row) => DESTINO_LABELS[row.destino] ?? row.destino,
  },
  { key: 'registros', label: 'Entregas', align: 'right', value: (row) => row.registros },
  { key: 'itens', label: 'Itens', align: 'right', value: (row) => row.itens },
];

const entreguesColumns: ReportColumn<
  RelatorioEstoque['entregasPorMaterial'][number]
>[] = [
  { key: 'nome', label: 'Material', value: (row) => row.nome },
  { key: 'registros', label: 'Entregas', align: 'right', value: (row) => row.registros },
  { key: 'total', label: 'Itens entregues', align: 'right', value: (row) => row.total },
];

const saldoColumns: ReportColumn<RelatorioEstoque['saldoAtual'][number]>[] = [
  { key: 'nome', label: 'Material', value: (row) => row.nome },
  { key: 'categoria', label: 'Categoria', value: (row) => row.categoria ?? '—' },
  { key: 'unidade', label: 'Unidade', value: (row) => row.unidade },
  {
    key: 'estoque',
    label: 'Estoque atual',
    align: 'right',
    value: (row) => row.estoqueAtual,
  },
];

export function EstoqueTab({ filtros }: { filtros: RelatorioFiltros }) {
  const { user } = useAuth();
  const fetcher = useCallback(() => fetchRelatorioEstoque(filtros), [filtros]);
  const { data, loading, error, forbidden, reload } = useRelatorio(fetcher);

  const grafico = useMemo(() => {
    if (!data) return null;
    const passo = Math.max(1, Math.ceil(data.serie.length / 10));
    return {
      dias: data.serie.map((ponto) => dayjs(ponto.dia).format('DD/MM')),
      recebidos: data.serie.map((ponto) => ponto.recebidos),
      entregues: data.serie.map((ponto) => ponto.entregues),
      passo,
    };
  }, [data]);

  if (forbidden) return <RelatorioForbidden />;
  if (loading) return <RelatorioLoading />;
  if (error || !data) return <RelatorioError onRetry={reload} />;

  const exportarPdf = async () => {
    const { openRelatorioPdf } = await import('../utils/relatorioPdf');
    await openRelatorioPdf({
      titulo: 'Relatório de estoque e entregas',
      periodoLabel: `Período: ${dayjs(filtros.de).format('DD/MM/YYYY')} a ${dayjs(filtros.ate).format('DD/MM/YYYY')}`,
      emissor: user?.name,
      stats: [
        { label: 'Itens recebidos', value: data.totais.itensRecebidos },
        { label: 'Itens entregues', value: data.totais.itensEntregues },
        {
          label: 'Materiais no catálogo',
          value: data.saldoAtual.length,
        },
      ],
      tabelas: [
        toPdfTabela('Recebimentos por material', recebidosColumns, data.recebidosPorMaterial),
        toPdfTabela('Recebimentos por origem', origemColumns, data.recebimentosPorOrigem),
        toPdfTabela('Entregas por destino', destinoColumns, data.entregasPorDestino),
        toPdfTabela('Entregas por material', entreguesColumns, data.entregasPorMaterial),
        toPdfTabela('Saldo atual de estoque', saldoColumns, data.saldoAtual),
      ],
      filename: `relatorio-estoque-${filtros.de}-a-${filtros.ate}.pdf`,
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
            label: 'Itens recebidos',
            value: data.totais.itensRecebidos,
            helper: 'Doações e entradas no período',
          },
          {
            label: 'Itens entregues',
            value: data.totais.itensEntregues,
            helper: 'Distribuídos no período',
          },
          {
            label: 'Materiais no catálogo',
            value: data.saldoAtual.length,
            helper: 'Materiais ativos',
          },
        ]}
      />

      {grafico && (
        <ChartCard title="Itens recebidos e entregues por dia">
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
                data: grafico.recebidos,
                label: 'Recebidos',
                color: chartColors.primaria,
                showMark: false,
                curve: 'linear',
              },
              {
                data: grafico.entregues,
                label: 'Entregues',
                color: chartColors.secundaria,
                showMark: false,
                curve: 'linear',
              },
            ]}
            grid={{ horizontal: true }}
          />
        </ChartCard>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Stack sx={{ flex: 1 }} spacing={2}>
          <ReportTable
            title="Recebimentos por material"
            columns={recebidosColumns}
            rows={data.recebidosPorMaterial}
            rowKey={(row, index) => `${row.materialId ?? 'avulso'}-${index}`}
            csvFilename={`estoque-recebimentos-${filtros.de}-a-${filtros.ate}.csv`}
            emptyMessage="Nenhum recebimento no período."
          />
          <ReportTable
            title="Recebimentos por origem"
            columns={origemColumns}
            rows={data.recebimentosPorOrigem}
            rowKey={(row) => row.origem}
            csvFilename={`estoque-origens-${filtros.de}-a-${filtros.ate}.csv`}
            emptyMessage="Nenhum recebimento no período."
          />
        </Stack>
        <Stack sx={{ flex: 1 }} spacing={2}>
          <ReportTable
            title="Entregas por material"
            columns={entreguesColumns}
            rows={data.entregasPorMaterial}
            rowKey={(row) => row.materialId}
            csvFilename={`estoque-entregas-${filtros.de}-a-${filtros.ate}.csv`}
            emptyMessage="Nenhuma entrega no período."
          />
          <ReportTable
            title="Entregas por destino"
            columns={destinoColumns}
            rows={data.entregasPorDestino}
            rowKey={(row) => row.destino}
            csvFilename={`estoque-destinos-${filtros.de}-a-${filtros.ate}.csv`}
            emptyMessage="Nenhuma entrega no período."
          />
        </Stack>
      </Stack>

      <ReportTable
        title="Saldo atual de estoque"
        columns={saldoColumns}
        rows={data.saldoAtual}
        rowKey={(row) => row.id}
        csvFilename="estoque-saldo-atual.csv"
        emptyMessage="Nenhum material ativo cadastrado."
      />
    </Stack>
  );
}
