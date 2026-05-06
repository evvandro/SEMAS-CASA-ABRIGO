import { useEffect, useMemo, useState } from 'react'
import { MOCK_ACOLHIDOS } from '../data/mockAcolhidos'
import type { Acolhido, AcolhidoAction, AcolhidosFilters, AlertCategory, CadastroPayload } from '../types'
import { createAcolhidoFromCadastro } from '../utils/acolhidoFactory'

const emptyFilters: AcolhidosFilters = {
  gestante: false,
  pcd: false,
  cronica: false,
  idoso: false,
}

export function useAcolhidosPageState() {
  // TODO: substituir por api.get('/acolhidos') quando a integracao estiver pronta.
  const [rows, setRows] = useState<Acolhido[]>(MOCK_ACOLHIDOS)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<AcolhidosFilters>(emptyFilters)
  const [sectorId, setSectorId] = useState('')
  const [fichaRow, setFichaRow] = useState<Acolhido | null>(null)
  const [cadastroOpen, setCadastroOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

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
    // TODO: substituir por api.post('/acolhidos', payload) quando a integracao estiver pronta.
    const newRow = createAcolhidoFromCadastro(payload)

    setRows(previousRows => [newRow, ...previousRows])
    setCadastroOpen(false)
    setToast(`${newRow.name.split(' ')[0]} acolhido(a) com sucesso`)
  }

  const handleAction = (action: AcolhidoAction, row: Acolhido) => {
    if (action === 'view') {
      setFichaRow(row)
      return
    }

    setToast(`Acao: ${action} - ${row.name.split(' ')[0]}`)
  }

  return {
    rows,
    filteredRows,
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
