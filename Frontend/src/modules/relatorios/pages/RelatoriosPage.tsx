import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Stack, Tab, Tabs } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { PageHeader } from '../../../components/PageHeader';
import { fetchSetores, type ApiSetor } from '../../../services/setoresService';
import type { RelatorioFiltros } from '../../../services/relatoriosService';
import { useAuth } from '../../../auth/useAuth';
import { PeriodoFilter } from '../components/PeriodoFilter';
import { AcolhimentosTab } from '../components/AcolhimentosTab';
import { OcupacaoTab } from '../components/OcupacaoTab';
import { EstoqueTab } from '../components/EstoqueTab';
import { PerfilTab } from '../components/PerfilTab';

type TabId = 'acolhimentos' | 'ocupacao' | 'estoque' | 'perfil';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'acolhimentos', label: 'Acolhimentos' },
  { id: 'ocupacao', label: 'Ocupação' },
  { id: 'estoque', label: 'Estoque e entregas' },
  { id: 'perfil', label: 'Perfil dos acolhidos' },
];

export function RelatoriosPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>('acolhimentos');
  const [de, setDe] = useState<Dayjs>(() => dayjs().subtract(29, 'day'));
  const [ate, setAte] = useState<Dayjs>(() => dayjs());
  const [setorId, setSetorId] = useState<number | null>(null);
  const [setores, setSetores] = useState<ApiSetor[]>([]);

  useEffect(() => {
    let active = true;

    fetchSetores()
      .then((lista) => {
        if (active) setSetores(lista.filter((setor) => setor.ativo));
      })
      .catch(() => {
        // O seletor de setor fica vazio; os relatórios seguem funcionando.
      });

    return () => {
      active = false;
    };
  }, []);

  const filtros: RelatorioFiltros = useMemo(
    () => ({
      de: de.format('YYYY-MM-DD'),
      ate: ate.format('YYYY-MM-DD'),
      setorId,
    }),
    [de, ate, setorId],
  );

  const setorNome = setorId
    ? setores.find((setor) => setor.id === setorId)?.nome
    : undefined;

  const podeVisualizar = user?.role === 'admin' || user?.role === 'tecnico';

  if (!podeVisualizar) {
    return (
      <Stack spacing={3}>
        <PageHeader
          title="Relatórios"
          description="Relatórios gerenciais da Casa Abrigo."
        />
        <Alert severity="warning">
          Seu perfil não tem permissão para visualizar relatórios.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Relatórios"
        description="Acolhimentos, ocupação, estoque e perfil dos acolhidos — com exportação em PDF e CSV."
      />

      <PeriodoFilter
        value={{ de, ate, setorId }}
        setores={setores}
        setorDesabilitado={tab === 'estoque'}
        onChange={(novoValor) => {
          setDe(novoValor.de);
          setAte(novoValor.ate);
          setSetorId(novoValor.setorId);
        }}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_event, novaTab: TabId) => setTab(novaTab)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {TABS.map((item) => (
            <Tab key={item.id} value={item.id} label={item.label} />
          ))}
        </Tabs>
      </Box>

      {tab === 'acolhimentos' && (
        <AcolhimentosTab filtros={filtros} setorNome={setorNome} />
      )}
      {tab === 'ocupacao' && (
        <OcupacaoTab filtros={filtros} setorNome={setorNome} />
      )}
      {tab === 'estoque' && <EstoqueTab filtros={filtros} />}
      {tab === 'perfil' && (
        <PerfilTab
          dataReferencia={filtros.ate}
          setorId={setorId}
          setorNome={setorNome}
        />
      )}
    </Stack>
  );
}
