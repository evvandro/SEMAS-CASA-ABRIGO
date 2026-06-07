import { useEffect, useMemo, useState } from 'react'
import {
  createAcolhido,
  fetchAcolhidoDetail,
  fetchAcolhidos,
  fetchSetores,
  toCadastroPayload,
  toSector,
  updateAcolhidoRecord,
} from '../../../services/acolhidosService'
import type { Acolhido, AcolhidoAction, AcolhidosFilters, CadastroPayload, Sector } from '../types'

type Toast = {
  message: string
  severity: 'success' | 'info' | 'error'
}

const emptyFilters: AcolhidosFilters = {
  gestante: false,
  pcd: false,
  cronica: false,
  idoso: false,
}

export function useAcolhidosPageState() {
  const [rows, setRows] = useState<Acolhido[]>([])
  const [heatmapRows, setHeatmapRows] = useState<Acolhido[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<AcolhidosFilters>(emptyFilters)
  const [sectorId, setSectorId] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [fichaRow, setFichaRow] = useState<Acolhido | null>(null)
  const [labelRow, setLabelRow] = useState<Acolhido | null>(null)
  const [editRow, setEditRow] = useState<Acolhido | null>(null)
  const [cadastroOpen, setCadastroOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = {
          search: search.trim() || undefined,
          setor_id: sectorId ? Number(sectorId) : undefined,
          pcd: filters.pcd || undefined,
          gestante: filters.gestante || undefined,
          cronica: filters.cronica || undefined,
          idoso: filters.idoso || undefined,
          page: page + 1,
          per_page: pageSize,
        }

        const [acolhidosResult, allAcolhidosResult, rawSetores] = await Promise.all([
          fetchAcolhidos(params),
          fetchAcolhidos(),
          fetchSetores(),
        ])

        if (!active) return

        const acolhidos = acolhidosResult.data
        const allAcolhidos = allAcolhidosResult.data
        const occupiedBySector = allAcolhidos.reduce<Record<string, number>>((acc, acolhido) => {
          if (acolhido.sectorId) acc[acolhido.sectorId] = (acc[acolhido.sectorId] ?? 0) + 1
          return acc
        }, {})

        const built = rawSetores.map(s =>
          toSector(s, occupiedBySector[String(s.id)] ?? 0),
        )

        setRows(acolhidos)
        setHeatmapRows(allAcolhidos)
        setSectors(built)
        setTotalRows(acolhidosResult.meta?.total ?? acolhidos.length)
      } catch {
        if (active) setError('Não foi possível carregar os dados. Verifique a conexão.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [search, filters, sectorId, page, pageSize])

  useEffect(() => {
    setPage(0)
  }, [search, filters, sectorId])
  
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]')?.focus()
      } else if (event.key.toLowerCase() === 'n' && !cadastroOpen && !fichaRow && !labelRow && !editRow) {
        const tag = (event.target as HTMLElement)?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          event.preventDefault()
          setCadastroOpen(true)
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cadastroOpen, fichaRow, labelRow, editRow])

  const sectorMap = useMemo(
    () => Object.fromEntries(sectors.map(s => [s.id, s])),
    [sectors],
  )

  const filteredRows = rows

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize)
    setPage(0)
  }

  const handleSave = async (payload: CadastroPayload) => {
    const newRow = await createAcolhido(payload)

    setRows(prev => [newRow, ...prev])
    setHeatmapRows(prev => [newRow, ...prev])
    setSectors(prev =>
      prev.map(s => s.id === newRow.sectorId ? { ...s, occupied: s.occupied + 1 } : s),
    )
    setCadastroOpen(false)
    setToast({ message: `${newRow.name.split(' ')[0]} acolhido(a) com sucesso`, severity: 'success' })
  }

  const applyAcolhidoUpdate = (updated: Acolhido) => {
    const previous = heatmapRows.find(row => row.apiId === updated.apiId)

    setRows(prev => prev.map(row => row.apiId === updated.apiId ? updated : row))
    setHeatmapRows(prev => prev.map(row => row.apiId === updated.apiId ? updated : row))
    setFichaRow(prev => prev?.apiId === updated.apiId ? updated : prev)
    setLabelRow(prev => prev?.apiId === updated.apiId ? updated : prev)
    setEditRow(prev => prev?.apiId === updated.apiId ? updated : prev)

    if (previous && previous.sectorId !== updated.sectorId) {
      setSectors(prev => prev.map(sector => {
        if (sector.id === previous.sectorId) return { ...sector, occupied: Math.max(sector.occupied - 1, 0) }
        if (sector.id === updated.sectorId) return { ...sector, occupied: sector.occupied + 1 }
        return sector
      }))
    }
  }

  const getAcolhidoDetail = async (row: Acolhido) => {
    const detail = await fetchAcolhidoDetail(row.apiId)
    applyAcolhidoUpdate(detail)
    return detail
  }

  const openFicha = (row: Acolhido) => {
    setFichaRow(row)
    void getAcolhidoDetail(row).catch(() => {
      setToast({ message: 'Não foi possível carregar a ficha completa.', severity: 'error' })
    })
  }

  const openLabel = (row: Acolhido) => {
    setLabelRow(row)
    void getAcolhidoDetail(row).then(setLabelRow).catch(() => {
      setToast({ message: 'Não foi possível carregar os dados da etiqueta.', severity: 'error' })
    })
  }

  const openQuickEdit = (row: Acolhido) => {
    setEditRow(row)
    setCadastroOpen(true)
    void getAcolhidoDetail(row).then(setEditRow).catch(() => {
      setToast({ message: 'Não foi possível carregar o cadastro para edição.', severity: 'error' })
    })
  }

  const closeCadastro = () => {
    setCadastroOpen(false)
    setEditRow(null)
  }

  const handleQuickUpdate = async (payload: CadastroPayload) => {
    if (!editRow) return

    const updated = await updateAcolhidoRecord(editRow.apiId, toCadastroPayload(payload))
    applyAcolhidoUpdate(updated)
    closeCadastro()
    setToast({ message: `${updated.name.split(' ')[0]} atualizado(a) com sucesso`, severity: 'success' })
  }

  const handleAction = (action: AcolhidoAction, row: Acolhido) => {
    if (action === 'view') {
      openFicha(row)
      return
    }

    if (action === 'label') {
      openLabel(row)
      return
    }

    if (action === 'edit') {
      openQuickEdit(row)
      return
    }

    setToast({ message: `Ação: ${action} — ${row.name.split(' ')[0]}`, severity: 'info' })
  }

  return {
    rows,
    heatmapRows,
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
    handlePageSizeChange,
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
    toast,
    setToast,
    applyAcolhidoUpdate,
    getAcolhidoDetail,
    openFicha,
    openLabel,
    openQuickEdit,
    closeCadastro,
    handleSave,
    handleQuickUpdate,
    handleAction,
  }
}
