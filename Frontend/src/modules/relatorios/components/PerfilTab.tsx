import { useCallback, useMemo } from 'react';
import { Button, Stack } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from 'dayjs';
import { useAuth } from '../../../auth/useAuth';
import {
  fetchRelatorioPerfil,
  type RelatorioPerfil,
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

const FAIXA_LABELS: Record<string, string> = {
  '0-11': '0 a 11 anos',
  '12-17': '12 a 17 anos',
  '18-29': '18 a 29 anos',
  '30-59': '30 a 59 anos',
  '60+': '60 anos ou mais',
  sem_data: 'Sem data de nascimento',
};

function generoLabel(genero: string): string {
  if (genero === 'nao_informado') return 'Não informado';
  return genero.charAt(0).toUpperCase() + genero.slice(1);
}

const faixasColumns: ReportColumn<{ faixa: string; total: number }>[] = [
  {
    key: 'faixa',
    label: 'Faixa etária',
    value: (row) => FAIXA_LABELS[row.faixa] ?? row.faixa,
  },
  { key: 'total', label: 'Total', align: 'right', value: (row) => row.total },
];

const generoColumns: ReportColumn<{ genero: string; total: number }>[] = [
  { key: 'genero', label: 'Gênero', value: (row) => generoLabel(row.genero) },
  { key: 'total', label: 'Total', align: 'right', value: (row) => row.total },
];

const setorColumns: ReportColumn<RelatorioPerfil['porSetor'][number]>[] = [
  { key: 'nome', label: 'Setor', value: (row) => row.nome },
  { key: 'total', label: 'Acolhidos', align: 'right', value: (row) => row.total },
];

export function PerfilTab({
  dataReferencia,
  setorId,
  setorNome,
}: {
  dataReferencia: string;
  setorId: number | null;
  setorNome?: string;
}) {
  const { user } = useAuth();
  const fetcher = useCallback(
    () => fetchRelatorioPerfil({ dataReferencia, setorId }),
    [dataReferencia, setorId],
  );
  const { data, loading, error, forbidden, reload } = useRelatorio(fetcher);

  const grafico = useMemo(() => {
    if (!data) return null;
    const faixasComDados = data.faixasEtarias.filter(
      (faixa) => faixa.faixa !== 'sem_data' || faixa.total > 0,
    );
    return {
      labels: faixasComDados.map((faixa) => FAIXA_LABELS[faixa.faixa] ?? faixa.faixa),
      totais: faixasComDados.map((faixa) => faixa.total),
    };
  }, [data]);

  if (forbidden) return <RelatorioForbidden />;
  if (loading) return <RelatorioLoading />;
  if (error || !data) return <RelatorioError onRetry={reload} />;

  const referenciaLabel = dayjs(data.dataReferencia).format('DD/MM/YYYY');

  const saudeRows = [
    { condicao: 'Pessoa com deficiência (PCD)', total: data.saude.pcd },
    { condicao: 'Gestante', total: data.saude.gestante },
    { condicao: 'Doença crônica', total: data.saude.cronica },
    { condicao: 'Idoso (60+)', total: data.saude.idoso },
  ];
  const saudeColumns: ReportColumn<(typeof saudeRows)[number]>[] = [
    { key: 'condicao', label: 'Condição de saúde', value: (row) => row.condicao },
    { key: 'total', label: 'Total', align: 'right', value: (row) => row.total },
  ];

  const exportarPdf = async () => {
    const { openRelatorioPdf } = await import('../utils/relatorioPdf');
    await openRelatorioPdf({
      titulo: 'Relatório de perfil dos acolhidos',
      periodoLabel: `Retrato em ${referenciaLabel}`,
      filtroLabel: setorNome ? `Setor: ${setorNome}` : undefined,
      emissor: user?.name,
      stats: [
        { label: 'Acolhidos na data', value: data.total },
        { label: 'PCD', value: data.saude.pcd },
        { label: 'Gestantes', value: data.saude.gestante },
        { label: 'Idosos (60+)', value: data.saude.idoso },
      ],
      tabelas: [
        toPdfTabela('Faixas etárias', faixasColumns, data.faixasEtarias),
        toPdfTabela('Gênero', generoColumns, data.genero),
        toPdfTabela('Condições de saúde', saudeColumns, saudeRows),
        toPdfTabela('Distribuição por setor', setorColumns, data.porSetor),
      ],
      filename: `relatorio-perfil-${data.dataReferencia}.pdf`,
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
            label: 'Acolhidos na data',
            value: data.total,
            helper: `Retrato em ${referenciaLabel}`,
          },
          { label: 'PCD', value: data.saude.pcd, helper: 'Pessoas com deficiência' },
          { label: 'Gestantes', value: data.saude.gestante, helper: 'Em acompanhamento' },
          { label: 'Idosos (60+)', value: data.saude.idoso, helper: 'Prioridade legal' },
        ]}
      />

      {grafico && grafico.totais.some((total) => total > 0) && (
        <ChartCard
          title="Faixas etárias"
          subtitle={`Acolhidos ativos em ${referenciaLabel}`}
        >
          <BarChart
            height={260}
            xAxis={[{ scaleType: 'band', data: grafico.labels }]}
            series={[
              {
                data: grafico.totais,
                label: 'Acolhidos',
                color: chartColors.primaria,
              },
            ]}
            hideLegend
            grid={{ horizontal: true }}
          />
        </ChartCard>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Stack sx={{ flex: 1 }} spacing={2}>
          <ReportTable
            title="Faixas etárias"
            columns={faixasColumns}
            rows={data.faixasEtarias}
            rowKey={(row) => row.faixa}
            csvFilename={`perfil-faixas-${data.dataReferencia}.csv`}
          />
          <ReportTable
            title="Gênero"
            columns={generoColumns}
            rows={data.genero}
            rowKey={(row) => row.genero}
            csvFilename={`perfil-genero-${data.dataReferencia}.csv`}
            emptyMessage="Nenhum acolhido ativo na data."
          />
        </Stack>
        <Stack sx={{ flex: 1 }} spacing={2}>
          <ReportTable
            title="Condições de saúde"
            columns={saudeColumns}
            rows={saudeRows}
            rowKey={(row) => row.condicao}
            csvFilename={`perfil-saude-${data.dataReferencia}.csv`}
          />
          <ReportTable
            title="Distribuição por setor"
            columns={setorColumns}
            rows={data.porSetor}
            rowKey={(row) => row.setorId}
            csvFilename={`perfil-setores-${data.dataReferencia}.csv`}
            emptyMessage="Nenhum acolhido ativo na data."
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
