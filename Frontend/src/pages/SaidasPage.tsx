import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
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

type SaidasTab = 'pessoas' | 'familias';

function getApiErrorMessage(error: unknown): string {
  const response = (
    error as {
      response?: {
        data?: { message?: string; errors?: Record<string, string[]> };
      };
    }
  ).response;
  const validationErrors = response?.data?.errors;
  const firstValidationMessage = validationErrors
    ? Object.values(validationErrors)[0]?.[0]
    : undefined;

  return (
    firstValidationMessage ??
    response?.data?.message ??
    'Falha ao registrar saida. Verifique os dados e tente novamente.'
  );
}

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
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pessoas, grupos, pessoasSaidas, familiasSaidas] =
        await Promise.all([
          fetchAcolhidos(),
          fetchFamilias(),
          fetchAcolhidos({ status: 'saida' }),
          fetchFamilias({ status: 'saida' }),
        ]);
      setAcolhidos(pessoas);
      setFamilias(grupos);
      setHistoricoAcolhidos(pessoasSaidas);
      setHistoricoFamilias(familiasSaidas);
    } catch {
      setErrorMsg('Nao foi possivel carregar pessoas e familias ativas.');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = async () => {
    if (tab === 'pessoas' && !selectedAcolhido) {
      setErrorMsg('Selecione uma pessoa antes de abrir a ficha de saida.');
      return;
    }

    if (tab === 'familias') {
      if (!selectedFamilia) {
        setErrorMsg('Selecione uma familia antes de abrir a ficha de saida.');
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
        setSuccessMsg('Saida da familia registrada com sucesso.');
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
        setSuccessMsg('Saida registrada com sucesso.');
      }

      setDialogOpen(false);
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" gutterBottom>
          Saidas
        </Typography>
        <Typography color="text.secondary">
          Registro operacional de saidas individuais e familiares.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, value: SaidasTab) => setTab(value)}
          sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label="Pessoas" value="pessoas" />
          <Tab label="Familias" value="familias" />
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
                `${option.name} | ${option.cpf || 'CPF nao informado'}${option.familyCode ? ` | ${option.familyCode}` : ''}`
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
                `${option.codigo} | ${option.responsavelNome ?? 'Responsavel nao informado'} | ${option.acolhidosCount} membro(s)`
              }
              value={selectedFamilia}
              onChange={(_, newValue) => setSelectedFamilia(newValue)}
              loading={loading}
              sx={{ minWidth: { md: 480 }, flex: 1 }}
              renderInput={(params) => (
                <TextField {...params} label="Familia ativa" />
              )}
            />
          )}

          <Button
            variant="contained"
            startIcon={<LogoutIcon />}
            onClick={openDialog}
          >
            Abrir ficha de saida
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
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">Historico de saidas</Typography>
          <Typography variant="body2" color="text.secondary">
            Registros desligados permanecem aqui para consulta operacional.
          </Typography>
        </Box>

        {tab === 'pessoas' ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Pessoa</TableCell>
                <TableCell>Familia</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Responsavel</TableCell>
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
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Familia</TableCell>
                <TableCell>Membros</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Responsavel</TableCell>
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
                      {familia.responsavelNome ?? 'Responsavel nao informado'}
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
        )}
      </Paper>

      <SaidaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveSaida}
        initialRow={tab === 'pessoas' ? selectedAcolhido : null}
        initialFamily={tab === 'familias' ? selectedFamilia : null}
      />

      <Snackbar
        open={!!successMsg}
        autoHideDuration={5000}
        onClose={() => setSuccessMsg('')}
      >
        <Alert
          onClose={() => setSuccessMsg('')}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMsg}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={5000}
        onClose={() => setErrorMsg('')}
      >
        <Alert
          onClose={() => setErrorMsg('')}
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function valueOrFallback(value?: string | number | null) {
  const normalized = value == null ? '' : String(value).trim();
  return normalized || 'Nao informado';
}

function formatDateTime(date?: string | null, time?: string | null) {
  if (!date) return 'Nao informado';

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
        Nenhuma saida registrada neste grupo.
      </TableCell>
    </TableRow>
  );
}
