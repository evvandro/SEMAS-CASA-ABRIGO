import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAcolhido,
  fetchAcolhidoDetail,
  fetchAcolhidos,
  fetchSetores,
  toCadastroPayload,
  toSector,
  updateAcolhidoRecord,
} from '../../../services/acolhidosService';
import type {
  Acolhido,
  AcolhidoAction,
  AcolhidosFilters,
  CadastroPayload,
  Sector,
} from '../types';
import {
  showErrorToast,
  showSuccessToast,
} from '../../../utils/notificationService';

type Toast = {
  message: string;
  severity: 'success' | 'info' | 'error';
};

const emptyFilters: AcolhidosFilters = {
  gestante: false,
  pcd: false,
  cronica: false,
  idoso: false,
};

export function useAcolhidosPageState() {
  const [rows, setRows] = useState<Acolhido[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<AcolhidosFilters>(emptyFilters);
  const [reloadKey, setReloadKey] = useState(0);
  const [sectorId, setSectorId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [fichaRow, setFichaRow] = useState<Acolhido | null>(null);
  const [labelRow, setLabelRow] = useState<Acolhido | null>(null);
  const [editRow, setEditRow] = useState<Acolhido | null>(null);
  const [cadastroOpen, setCadastroOpen] = useState(false);

  // Toasts unificados no serviço global (sonner) — antes esta tela tinha um
  // Snackbar MUI próprio, com visual diferente do resto do app.
  const setToast = (toast: Toast | null) => {
    if (!toast) return;
    if (toast.severity === 'error') {
      showErrorToast('Erro', toast.message);
    } else {
      showSuccessToast(
        toast.severity === 'info' ? 'Aviso' : 'Tudo certo',
        toast.message,
      );
    }
  };

  // Debounce da busca: um request por pausa de digitação, não por tecla.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          search: debouncedSearch || undefined,
          setor_id: sectorId ? Number(sectorId) : undefined,
          pcd: filters.pcd || undefined,
          gestante: filters.gestante || undefined,
          cronica: filters.cronica || undefined,
          idoso: filters.idoso || undefined,
          page: page + 1,
          per_page: pageSize,
        };

        const [acolhidosResult, rawSetores] = await Promise.all([
          fetchAcolhidos(params),
          fetchSetores(),
        ]);

        if (!active) return;

        const acolhidos = acolhidosResult.data;
        const occupiedBySector = acolhidos.reduce<Record<string, number>>(
          (acc, acolhido) => {
            if (acolhido.sectorId)
              acc[acolhido.sectorId] = (acc[acolhido.sectorId] ?? 0) + 1;
            return acc;
          },
          {},
        );

        const built = rawSetores.map((s) =>
          toSector(s, occupiedBySector[String(s.id)] ?? 0),
        );

        setRows(acolhidos);
        setSectors(built);
        setTotalRows(acolhidosResult.meta?.total ?? acolhidos.length);
      } catch {
        if (active)
          setError('Não foi possível carregar os dados. Verifique a conexão.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [debouncedSearch, filters, sectorId, page, pageSize, reloadKey]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, filters, sectorId]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document
          .querySelector<HTMLInputElement>('input[placeholder*="Buscar"]')
          ?.focus();
      } else if (
        event.key.toLowerCase() === 'n' &&
        !cadastroOpen &&
        !fichaRow &&
        !labelRow &&
        !editRow
      ) {
        const tag = (event.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          event.preventDefault();
          setCadastroOpen(true);
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cadastroOpen, fichaRow, labelRow, editRow]);

  const sectorMap = useMemo(
    () => Object.fromEntries(sectors.map((s) => [s.id, s])),
    [sectors],
  );

  const filteredRows = rows;

  const handleSave = async (payload: CadastroPayload) => {
    const newRow = await createAcolhido(payload);

    // Com paginação server-side, refazer a busca mantém página e total corretos
    // (um prepend local estouraria o tamanho da página).
    refresh();
    setCadastroOpen(false);
    setToast({
      message: `${newRow.name.split(' ')[0]} acolhido(a) com sucesso`,
      severity: 'success',
    });
  };

  const applyAcolhidoUpdate = (updated: Acolhido) => {
    const previous = rows.find((row) => row.apiId === updated.apiId);

    setRows((prev) =>
      prev.map((row) => (row.apiId === updated.apiId ? updated : row)),
    );
    setFichaRow((prev) => (prev?.apiId === updated.apiId ? updated : prev));
    setLabelRow((prev) => (prev?.apiId === updated.apiId ? updated : prev));
    setEditRow((prev) => (prev?.apiId === updated.apiId ? updated : prev));

    if (previous && previous.sectorId !== updated.sectorId) {
      setSectors((prev) =>
        prev.map((sector) => {
          if (sector.id === previous.sectorId)
            return { ...sector, occupied: Math.max(sector.occupied - 1, 0) };
          if (sector.id === updated.sectorId)
            return { ...sector, occupied: sector.occupied + 1 };
          return sector;
        }),
      );
    }
  };

  const removeRow = (acolhidoId: number) => {
    const removedRow = rows.find((row) => row.apiId === acolhidoId);
    setRows((prev) => prev.filter((row) => row.apiId !== acolhidoId));
    setTotalRows((prev) => Math.max(prev - 1, 0));

    if (removedRow && removedRow.sectorId) {
      setSectors((prev) =>
        prev.map((sector) =>
          sector.id === removedRow.sectorId
            ? { ...sector, occupied: Math.max(sector.occupied - 1, 0) }
            : sector,
        ),
      );
    }

    setFichaRow((prev) => (prev?.apiId === acolhidoId ? null : prev));
    setLabelRow((prev) => (prev?.apiId === acolhidoId ? null : prev));
    setEditRow((prev) => (prev?.apiId === acolhidoId ? null : prev));
  };

  const removeRowsByFamily = (familiaId: number) => {
    const removedRows = rows.filter((row) => row.familyId === familiaId);
    setRows((prev) => prev.filter((row) => row.familyId !== familiaId));
    setTotalRows((prev) => Math.max(prev - removedRows.length, 0));

    removedRows.forEach((row) => {
      if (row.sectorId) {
        setSectors((prev) =>
          prev.map((sector) =>
            sector.id === row.sectorId
              ? { ...sector, occupied: Math.max(sector.occupied - 1, 0) }
              : sector,
          ),
        );
      }
    });

    setFichaRow((prev) => (prev?.familyId === familiaId ? null : prev));
    setLabelRow((prev) => (prev?.familyId === familiaId ? null : prev));
    setEditRow((prev) => (prev?.familyId === familiaId ? null : prev));
  };

  const getAcolhidoDetail = async (row: Acolhido) => {
    const detail = await fetchAcolhidoDetail(row.apiId);
    applyAcolhidoUpdate(detail);
    return detail;
  };

  const openFicha = (row: Acolhido) => {
    setFichaRow(row);
    void getAcolhidoDetail(row).catch(() => {
      setToast({
        message: 'Não foi possível carregar a ficha completa.',
        severity: 'error',
      });
    });
  };

  const openLabel = (row: Acolhido) => {
    setLabelRow(row);
    void getAcolhidoDetail(row)
      .then(setLabelRow)
      .catch(() => {
        setToast({
          message: 'Não foi possível carregar os dados da etiqueta.',
          severity: 'error',
        });
      });
  };

  const openQuickEdit = (row: Acolhido) => {
    setEditRow(row);
    setCadastroOpen(true);
    void getAcolhidoDetail(row)
      .then(setEditRow)
      .catch(() => {
        setToast({
          message: 'Não foi possível carregar o cadastro para edição.',
          severity: 'error',
        });
      });
  };

  const closeCadastro = () => {
    setCadastroOpen(false);
    setEditRow(null);
  };

  const handleQuickUpdate = async (payload: CadastroPayload) => {
    if (!editRow) return;

    const updated = await updateAcolhidoRecord(
      editRow.apiId,
      toCadastroPayload(payload),
    );
    applyAcolhidoUpdate(updated);
    closeCadastro();
    setToast({
      message: `${updated.name.split(' ')[0]} atualizado(a) com sucesso`,
      severity: 'success',
    });
  };

  const handleAction = (action: AcolhidoAction, row: Acolhido) => {
    if (action === 'view') {
      openFicha(row);
      return;
    }

    if (action === 'label') {
      openLabel(row);
      return;
    }

    if (action === 'edit') {
      openQuickEdit(row);
      return;
    }

    setToast({
      message: `Ação: ${action} — ${row.name.split(' ')[0]}`,
      severity: 'info',
    });
  };

  return {
    rows,
    sectors,
    sectorMap,
    filteredRows,
    loading,
    error,
    search,
    setSearch,
    filters,
    setFilters,
    sectorId,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalRows,
    setSectorId,
    fichaRow,
    setFichaRow,
    labelRow,
    setLabelRow,
    editRow,
    setEditRow,
    cadastroOpen,
    setCadastroOpen,
    setToast,
    refresh,
    applyAcolhidoUpdate,
    removeRow,
    removeRowsByFamily,
    getAcolhidoDetail,
    openFicha,
    openLabel,
    openQuickEdit,
    closeCadastro,
    handleSave,
    handleQuickUpdate,
    handleAction,
  };
}
