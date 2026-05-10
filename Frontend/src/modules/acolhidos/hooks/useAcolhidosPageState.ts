import { useEffect, useMemo, useState } from 'react'
import { createAcolhido, fetchAcolhidos, fetchSetores, toSector } from '../../../services/acolhidosService'
import type { Acolhido, AcolhidoAction, AcolhidosFilters, AlertCategory, CadastroPayload, Sector } from '../types'

const emptyFilters: AcolhidosFilters = {
  gestante: false,
  pcd: false,
  cronica: false,
  idoso: false,
}

export function useAcolhidosPageState() {
  const [rows, setRows] = useState<Acolhido[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<AcolhidosFilters>(emptyFilters)
  const [sectorId, setSectorId] = useState('')
  const [fichaRow, setFichaRow] = useState<Acolhido | null>(null)
  const [cadastroOpen, setCadastroOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [acolhidos, rawSetores] = await Promise.all([fetchAcolhidos(), fetchSetores()])
        if (!active) return
        const built = rawSetores.map(s =>
          toSector(s, acolhidos.filter(a => a.sectorId === String(s.id)).length),
        )
        setRows(acolhidos)
        setSectors(built)
      } catch {
        if (active) setError('Não foi possível carregar os dados. Verifique a conexão.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]')?.focus()
      } else if (event.key.toLowerCase() === 'n' && !cadastroOpen && !fichaRow) {
        const tag = (event.target as HTMLElement)?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          event.preventDefault()
          setCadastroOpen(true)
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cadastroOpen, fichaRow])

  const sectorMap = useMemo(
    () => Object.fromEntries(sectors.map(s => [s.id, s])),
    [sectors],
  )

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const activeAlerts = (Object.keys(filters) as AlertCategory[]).filter(key => filters[key])

    return rows.filter(row => {
      if (query && !`${row.name} ${row.cpf} ${row.id}`.toLowerCase().includes(query)) return false
      if (activeAlerts.some(alert => !row.alerts.includes(alert))) return false
      if (sectorId && row.sectorId !== sectorId) return false
      return true
    })
  }, [rows, search, filters, sectorId])

  const handleSave = async (payload: CadastroPayload) => {
    const newRow = await createAcolhido(payload)

    setRows(prev => [newRow, ...prev])
    setSectors(prev =>
      prev.map(s => s.id === newRow.sectorId ? { ...s, occupied: s.occupied + 1 } : s),
    )
    setCadastroOpen(false)
    setToast(`${newRow.name.split(' ')[0]} acolhido(a) com sucesso`)
  }

  const handleAction = (action: AcolhidoAction, row: Acolhido) => {
    if (action === 'view') {
      setFichaRow(row)
      return
    }

    setToast(`Ação: ${action} — ${row.name.split(' ')[0]}`)
  }

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
    cadastroOpen,
    setCadastroOpen,
    toast,
    setToast,
    handleSave,
    handleAction,
  }
}
