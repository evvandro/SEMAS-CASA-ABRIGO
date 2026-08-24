import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { SaidaDialog } from '../modules/acolhidos/components/SaidaDialog';
import type {
  Acolhido,
  Familia,
  SaidaPayload,
} from '../modules/acolhidos/types';
import {
  fetchAcolhidos,
  registerAcolhidoSaida,
} from '../services/acolhidosService';
import {
  fetchFamiliaDetail,
  fetchFamilias,
  registerFamiliaSaida,
  toIsoDate,
} from '../services/familiasService';
import { ExportPDFButton } from '../components/ExportPDFButton';
import type { ReportColumn } from '../components/ReportTemplate';
import { scrollAppContentToTop } from '../utils/scrollAppContent';
import { showErrorToast, showSuccessToast } from '../utils/notificationService';
import { notifyAcolhidosCountRefresh } from '../utils/acolhidosEvents';
import { getApiErrorMessage } from '../utils/apiError';
import { PageHeader } from '../components/PageHeader';

type SaidasTab = 'pessoas' | 'familias';

const acolhidosColumns: ReportColumn[] = [
  { header: 'Data', key: 'data', width: '15%' },
  { header: 'Pessoa', key: 'name', width: '25%' },
  { header: 'Familia', key: 'familyCode', width: '15%' },
  { header: 'Tipo', key: 'exitType', width: '15%' },
  { header: 'Destino', key: 'exitDestination', width: '15%' },
  { header: 'Responsável', key: 'exitResponsible', width: '15%' },
];

const familiasColumns: ReportColumn[] = [
  { header: 'Data', key: 'data', width: '15%' },
  { header: 'Familia', key: 'codigo', width: '25%' },
  { header: 'Membros', key: 'acolhidosCount', width: '15%' },
  { header: 'Tipo', key: 'tipoSaida', width: '15%' },
  { header: 'Destino', key: 'destinoCompleto', width: '15%' },
  { header: 'Responsável', key: 'responsavelDesligamento', width: '15%' },
];

export function SaidasPage() {
  const [tab, setTab] = useState<SaidasTab>('pessoas');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [acolhidos, setAcolhidos] = useState<Acolhido[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [historicoAcolhidos, setHistoricoAcolhidos] = useState<Acolhido[]>([]);
  const [historicoFamilias, setHistoricoFamilias] = useState<Familia[]>([]);
  const [selectedAcolhido, setSelectedAcolhido] = useState<Acolhido | null>(
    null,
  );
  const [selectedFamilia, setSelectedFamilia] = useState<Familia | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ativos são limitados pela capacidade da casa; o histórico de saídas
      // cresce sem limite, então carrega apenas os 50 mais recentes.
      const [pessoasResult, grupos, pessoasSaidasResult, familiasSaidas] =
        await Promise.all([
          fetchAcolhidos(),
          fetchFamilias(),
          fetchAcolhidos({ status: 'saida', per_page: 50 }),
          fetchFamilias({ status: 'saida', perPage: 50 }),
        ]);
      setAcolhidos(pessoasResult.data);
      setFamilias(grupos);
      setHistoricoAcolhidos(pessoasSaidasResult.data);
      setHistoricoFamilias(familiasSaidas);
    } catch {
      setErrorMsg('Não foi possível carregar pessoas e famílias ativas.');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = async () => {
    if (tab === 'pessoas' && !selectedAcolhido) {
      const message = 'Selecione uma pessoa antes de abrir a ficha de saida.';
      setErrorMsg(message);
      scrollAppContentToTop();
      showErrorToast('Aviso', message);
      return;
    }

    if (tab === 'familias') {
      if (!selectedFamilia) {
        const message =
          'Selecione uma familia antes de abrir a ficha de saida.';
        setErrorMsg(message);
        scrollAppContentToTop();
        showErrorToast('Aviso', message);
        return;
      }

      setSelectedFamilia(await fetchFamiliaDetail(selectedFamilia.id));
    }

    setDialogOpen(true);
  };

  const handleSaveSaida = async (payload: SaidaPayload) => {
    const tipoSaida =
      payload.tipoDesligamento === 'Outro' && payload.tipoDesligamentoOutro
        ? payload.tipoDesligamentoOutro
        : payload.tipoDesligamento;

    try {
      if (tab === 'familias' && selectedFamilia) {
        const familiaSaida = await registerFamiliaSaida(
          selectedFamilia.id,
          payload,
        );
        setFamilias((prev) =>
          prev.filter((familia) => familia.id !== selectedFamilia.id),
        );
        setAcolhidos((prev) =>
          prev.filter((acolhido) => acolhido.familyId !== selectedFamilia.id),
        );
        setHistoricoFamilias((prev) => [familiaSaida, ...prev]);
        const membrosSaidos =
          selectedFamilia.membros?.map((membro) => ({
            ...membro,
            exitDate: familiaSaida.dataSaida,
            exitTime: familiaSaida.horaSaida,
            exitType: familiaSaida.tipoSaida,
            exitDestination: familiaSaida.destinoInformado,
            exitCity: familiaSaida.municipioDestino,
            exitCondition: familiaSaida.condicaoSaida,
            exitResponsible: familiaSaida.responsavelDesligamento,
          })) ?? [];
        setHistoricoAcolhidos((prev) => [...membrosSaidos, ...prev]);
        setSelectedFamilia(null);
        showSuccessToast(
          'Saída registrada',
          'Saída da família registrada com sucesso.',
        );
        notifyAcolhidosCountRefresh();
        scrollAppContentToTop();
      } else if (selectedAcolhido) {
        const pessoaSaida = await registerAcolhidoSaida(
          selectedAcolhido.apiId,
          toIsoDate(payload.data),
          tipoSaida,
          payload,
        );
        setAcolhidos((prev) =>
          prev.filter((acolhido) => acolhido.apiId !== selectedAcolhido.apiId),
        );
        setHistoricoAcolhidos((prev) => [pessoaSaida, ...prev]);
        setSelectedAcolhido(null);
        showSuccessToast('Saída registrada', 'Saída registrada com sucesso.');
        notifyAcolhidosCountRefresh();
        scrollAppContentToTop();
      }

      setDialogOpen(false);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Falha ao registrar saída. Verifique os dados e tente novamente.',
      );
      setErrorMsg(message);
      scrollAppContentToTop();
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <PageHeader
          title="Saídas"
          description="Registro operacional de saídas individuais e familiares."
        />
      </Box>
      {errorMsg ? (
        <Alert severity="error" onClose={() => setErrorMsg('')} sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      ) : null}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, value: SaidasTab) => setTab(value)}
          sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label="Pessoas" value="pessoas" />
          <Tab label="Famílias" value="familias" />
        </Tabs>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 3 }}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          {tab === 'pessoas' ? (
            <Autocomplete
              options={acolhidos}
              getOptionLabel={(option) =>
                `${option.name} | ${option.cpf || 'CPF não informado'}${option.familyCode ? ` | ${option.familyCode}` : ''}`
              }
              value={selectedAcolhido}
              onChange={(_, newValue) => setSelectedAcolhido(newValue)}
              loading={loading}
              sx={{ minWidth: { md: 480 }, flex: 1 }}
              renderInput={(params) => (
                <TextField {...params} label="Pessoa acolhida ativa" />
              )}
            />
          ) : (
            <Autocomplete
              options={familias}
              getOptionLabel={(option) =>
                `${option.codigo} | ${option.responsavelNome ?? 'Responsável não informado'} | ${option.acolhidosCount} membro(s)`
              }
              value={selectedFamilia}
              onChange={(_, newValue) => setSelectedFamilia(newValue)}
              loading={loading}
              sx={{ minWidth: { md: 480 }, flex: 1 }}
              renderInput={(params) => (
                <TextField {...params} label="Família ativa" />
              )}
            />
          )}

          <Button
            variant="contained"
            startIcon={<LogoutIcon />}
            onClick={openDialog}
          >
            Abrir ficha de saída
          </Button>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mt: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h6">Histórico de saídas</Typography>
            <Typography variant="body2" color="text.secondary">
              Registros desligados permanecem aqui para consulta operacional.
            </Typography>
          </Box>
          {tab === 'pessoas' ? (
            <ExportPDFButton
              title="Relatório de Saídas - Pessoas"
              columns={acolhidosColumns}
              data={historicoAcolhidos.map((a) => ({
                ...a,
                data: formatDateTime(a.exitDate, a.exitTime),
                familyCode: a.familyCode || 'Pessoa sozinha',
              }))}
              filename="saidas-pessoas.pdf"
              variant="text"
              color="secondary"
            />
          ) : (
            <ExportPDFButton
              title="Relatório de Saídas - Famílias"
              columns={familiasColumns}
              data={historicoFamilias.map((f) => ({
                ...f,
                data: formatDateTime(f.dataSaida, f.horaSaida),
                destinoCompleto: [f.destinoInformado, f.municipioDestino]
                  .filter(Boolean)
                  .join(' - '),
              }))}
              filename="saidas-familias.pdf"
              variant="text"
              color="secondary"
            />
          )}
        </Box>

        {tab === 'pessoas' ? (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Pessoa</TableCell>
                <TableCell>Família</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Responsável</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historicoAcolhidos.map((acolhido) => (
                <TableRow key={acolhido.apiId} hover>
                  <TableCell>
                    {formatDateTime(acolhido.exitDate, acolhido.exitTime)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {acolhido.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {acolhido.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {acolhido.familyCode ? (
                      <Chip size="small" label={acolhido.familyCode} />
                    ) : (
                      'Pessoa sozinha'
                    )}
                  </TableCell>
                  <TableCell>{valueOrFallback(acolhido.exitType)}</TableCell>
                  <TableCell>
                    {valueOrFallback(
                      [acolhido.exitDestination, acolhido.exitCity]
                        .filter(Boolean)
                        .join(' - '),
                    )}
                  </TableCell>
                  <TableCell>
                    {valueOrFallback(acolhido.exitResponsible)}
                  </TableCell>
                </TableRow>
              ))}
              {historicoAcolhidos.length === 0 ? (
                <EmptyHistoryRow colSpan={6} />
              ) : null}
            </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Família</TableCell>
                <TableCell>Membros</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Responsável</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historicoFamilias.map((familia) => (
                <TableRow key={familia.id} hover>
                  <TableCell>
                    {formatDateTime(familia.dataSaida, familia.horaSaida)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {familia.codigo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {familia.responsavelNome ?? 'Responsável não informado'}
                    </Typography>
                  </TableCell>
                  <TableCell>{familia.acolhidosCount}</TableCell>
                  <TableCell>{valueOrFallback(familia.tipoSaida)}</TableCell>
                  <TableCell>
                    {valueOrFallback(
                      [familia.destinoInformado, familia.municipioDestino]
                        .filter(Boolean)
                        .join(' - '),
                    )}
                  </TableCell>
                  <TableCell>
                    {valueOrFallback(familia.responsavelDesligamento)}
                  </TableCell>
                </TableRow>
              ))}
              {historicoFamilias.length === 0 ? (
                <EmptyHistoryRow colSpan={6} />
              ) : null}
            </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <SaidaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveSaida}
        initialRow={tab === 'pessoas' ? selectedAcolhido : null}
        initialFamily={tab === 'familias' ? selectedFamilia : null}
      />
    </Box>
  );
}

function valueOrFallback(value?: string | number | null) {
  const normalized = value == null ? '' : String(value).trim();
  return normalized || 'Não informado';
}

function formatDateTime(date?: string | null, time?: string | null) {
  if (!date) return 'Não informado';

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(
    'pt-BR',
  );
  return time ? `${formattedDate} ${time}` : formattedDate;
}

function EmptyHistoryRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}
      >
        Nenhuma saída registrada neste grupo.
      </TableCell>
    </TableRow>
  );
}
