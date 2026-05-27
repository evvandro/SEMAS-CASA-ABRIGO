import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../../auth/useAuth'
import { registerAcolhidoSaida, updateAcolhidoRecord } from '../../../services/acolhidosService'
import { fetchFamiliaDetail, registerFamiliaSaida, toIsoDate } from '../../../services/familiasService'
import { AcolhidosTable } from '../components/AcolhidosTable'
import { AcolhidosToolbar } from '../components/AcolhidosToolbar'
import { CadastroDrawer } from '../components/CadastroDrawer'
import { FichaDrawer } from '../components/FichaDrawer'
import { PertencesLabelDialog } from '../components/PertencesLabelDialog'
import { SaidaDialog } from '../components/SaidaDialog'
import { SectorHeatmap } from '../components/SectorHeatmap'
import { useAcolhidosPageState } from '../hooks/useAcolhidosPageState'
import type { Acolhido, AcolhidoAction, Familia, SaidaPayload } from '../types'
import { useState } from 'react'
import { scrollAppContentToTop } from '../../../utils/scrollAppContent'

function getApiErrorMessage(error: unknown): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
  const validationErrors = response?.data?.errors
  const firstValidationMessage = validationErrors ? Object.values(validationErrors)[0]?.[0] : undefined

  return firstValidationMessage ?? response?.data?.message ?? 'Nao foi possivel registrar a saida.'
}

export function AcolhidosPage() {
  const state = useAcolhidosPageState()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saidaOpen, setSaidaOpen] = useState(false)
  const [saidaRow, setSaidaRow] = useState<Acolhido | null>(null)
  const [saidaFamilia, setSaidaFamilia] = useState<Familia | null>(null)

  const handleAcolhidoAction = async (action: AcolhidoAction, row: Acolhido) => {
    if (action === 'view') {
      state.openFicha(row)
      return
    }

    if (action === 'label') {
      state.openLabel(row)
      return
    }

    if (action === 'edit') {
      state.openQuickEdit(row)
      return
    }

    if (action === 'editFull') {
      state.setFichaRow(null)
      state.setLabelRow(null)
      state.setEditRow(null)
      navigate(`/acolhidos/cadastros?edit=${row.apiId}`)
      return
    }

    if (action === 'exit') {
      setSaidaFamilia(null)
      setSaidaRow(row)
      setSaidaOpen(true)
      return
    }

    if (action === 'exitFamily' && row.familyId) {
      try {
        setSaidaRow(null)
        setSaidaFamilia(await fetchFamiliaDetail(row.familyId))
        setSaidaOpen(true)
      } catch {
        toast.error('Nao foi possivel carregar a familia para saida.')
      }
      return
    }

    if (action === 'print') {
      try {
        const detail = await state.getAcolhidoDetail(row)
        const { openAcolhidoFichaPdf } = await import('../utils/pdfDocuments')
        await openAcolhidoFichaPdf(detail, state.sectorMap[detail.sectorId], user?.name)
        toast.success('PDF da ficha gerado com sucesso.')
      } catch {
        toast.error('Nao foi possivel gerar o PDF da ficha.')
      }
      return
    }

    state.handleAction(action, row)
  }

  const handleSaveSaida = async (payload: SaidaPayload) => {
    const tipoSaida = payload.tipoDesligamento === 'Outro' && payload.tipoDesligamentoOutro
      ? payload.tipoDesligamentoOutro
      : payload.tipoDesligamento

    try {
      if (saidaFamilia) {
        await registerFamiliaSaida(saidaFamilia.id, payload)
        state.removeRowsByFamily(saidaFamilia.id)
        setSaidaOpen(false)
        setSaidaFamilia(null)
        state.setFichaRow(null)
        scrollAppContentToTop()
        toast.success('Saida da familia registrada com sucesso.')
        return
      }

      if (saidaRow) {
        await registerAcolhidoSaida(saidaRow.apiId, toIsoDate(payload.data), tipoSaida, payload)
        state.removeRow(saidaRow.apiId)
        setSaidaOpen(false)
        setSaidaRow(null)
        state.setFichaRow(null)
        scrollAppContentToTop()
        toast.success('Saida registrada com sucesso.')
      }
    } catch (error) {
      scrollAppContentToTop()
      toast.error(getApiErrorMessage(error))
    }
  }

  const handleGenerateLabel = async ({ shelterName, belongings }: { shelterName: string; belongings: string }) => {
    if (!state.labelRow) return

    const updated = await updateAcolhidoRecord(state.labelRow.apiId, {
      pertences_registrados: belongings || null,
    })

    state.applyAcolhidoUpdate(updated)
    const { openPertencesLabelPdf } = await import('../utils/pdfDocuments')
    await openPertencesLabelPdf(updated, state.sectorMap[updated.sectorId], shelterName, belongings)
    state.setLabelRow(null)
    toast.success('Etiqueta de pertences gerada com sucesso.')
  }

  if (state.loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (state.error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{state.error}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h4" gutterBottom>Gestão de Acolhidos</Typography>
        <Typography color="text.secondary">
          Famílias e indivíduos acolhidos na Casa Abrigo Temporário.
        </Typography>
      </Box>

      <AcolhidosToolbar
        search={state.search} onSearch={state.setSearch}
        filters={state.filters} onFilters={state.setFilters}
        sectorId={state.sectorId} onSector={state.setSectorId}
        sectors={state.sectors}
        count={state.filteredRows.length}
        onNew={() => { state.setEditRow(null); state.setCadastroOpen(true) }}
        onFullRegistration={() => navigate('/acolhidos/cadastros')}
      />

      <AcolhidosTable
        rows={state.filteredRows}
        sectorMap={state.sectorMap}
        onRowClick={state.openFicha}
        onAction={handleAcolhidoAction}
      />

      <SectorHeatmap
        rows={state.rows}
        sectors={state.sectors}
        activeSectorId={state.sectorId}
        onSelectSector={state.setSectorId}
      />

      <FichaDrawer
        row={state.fichaRow}
        sectorMap={state.sectorMap}
        onClose={() => state.setFichaRow(null)}
        operatorName={user?.name}
        onAction={handleAcolhidoAction}
      />

      <PertencesLabelDialog
        row={state.labelRow}
        sector={state.labelRow ? state.sectorMap[state.labelRow.sectorId] : undefined}
        onClose={() => state.setLabelRow(null)}
        onGenerate={handleGenerateLabel}
      />

      <CadastroDrawer
        open={state.cadastroOpen}
        onClose={state.closeCadastro}
        onSave={state.editRow ? state.handleQuickUpdate : state.handleSave}
        sectors={state.sectors}
        mode={state.editRow ? 'edit' : 'create'}
        initialRow={state.editRow}
      />

      <SaidaDialog
        open={saidaOpen}
        onClose={() => {
          setSaidaOpen(false)
          setSaidaRow(null)
          setSaidaFamilia(null)
        }}
        onSave={handleSaveSaida}
        initialRow={saidaRow}
        initialFamily={saidaFamilia}
      />

    </Box>
  )
}
