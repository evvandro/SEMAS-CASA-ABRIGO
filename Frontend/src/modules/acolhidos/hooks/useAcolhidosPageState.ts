import { useEffect, useMemo, useState } from 'react';
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
  AlertCategory,
  CadastroPayload,
  Sector,
} from '../types';

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
  const [filters, setFilters] = useState<AcolhidosFilters>(emptyFilters);
  const [sectorId, setSectorId] = useState('');
  const [fichaRow, setFichaRow] = useState<Acolhido | null>(null);
  const [labelRow, setLabelRow] = useState<Acolhido | null>(null);
  const [editRow, setEditRow] = useState<Acolhido | null>(null);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [acolhidos, rawSetores] = await Promise.all([
          fetchAcolhidos(),
          fetchSetores(),
        ]);
        if (!active) return;
        const built = rawSetores.map((s) =>
          toSector(
            s,
            acolhidos.filter((a) => a.sectorId === String(s.id)).length,
          ),
        );
        setRows(acolhidos);
        setSectors(built);
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
  }, []);

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

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const activeAlerts = (Object.keys(filters) as AlertCategory[]).filter(
      (key) => filters[key],
    );

    return rows.filter((row) => {
      if (
        query &&
        !`${row.name} ${row.cpf} ${row.id} ${row.familyCode ?? ''} ${row.familyResponsible ?? ''}`
          .toLowerCase()
          .includes(query)
      )
        return false;
      if (activeAlerts.some((alert) => !row.alerts.includes(alert)))
        return false;
      if (sectorId && row.sectorId !== sectorId) return false;
      return true;
    });
  }, [rows, search, filters, sectorId]);

  const handleSave = async (payload: CadastroPayload) => {
    const newRow = await createAcolhido(payload);

    setRows((prev) => [newRow, ...prev]);
    setSectors((prev) =>
      prev.map((s) =>
        s.id === newRow.sectorId ? { ...s, occupied: s.occupied + 1 } : s,
      ),
    );
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

  const removeRow = (apiId: number) => {
    const previous = rows.find((row) => row.apiId === apiId);

    setRows((prev) => prev.filter((row) => row.apiId !== apiId));
    if (previous) {
      setSectors((prev) =>
        prev.map((sector) =>
          sector.id === previous.sectorId
            ? { ...sector, occupied: Math.max(sector.occupied - 1, 0) }
            : sector,
        ),
      );
    }
  };

  const removeRowsByFamily = (familyId: number) => {
    const removed = rows.filter((row) => row.familyId === familyId);

    setRows((prev) => prev.filter((row) => row.familyId !== familyId));
    setSectors((prev) =>
      prev.map((sector) => {
        const removedCount = removed.filter(
          (row) => row.sectorId === sector.id,
        ).length;
        return removedCount
          ? { ...sector, occupied: Math.max(sector.occupied - removedCount, 0) }
          : sector;
      }),
    );
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
    setSectorId,
    fichaRow,
    setFichaRow,
    labelRow,
    setLabelRow,
    editRow,
    setEditRow,
    cadastroOpen,
    setCadastroOpen,
    toast,
    setToast,
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
