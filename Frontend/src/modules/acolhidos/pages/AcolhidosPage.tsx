import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
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

    if (action === 'deliver') {
      state.setFichaRow(null)
      navigate(`/estoque?acolhido=${row.apiId}`)
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
        state.setToast({ message: 'Nao foi possivel carregar a familia para saida.', severity: 'error' })
      }
      return
    }

    if (action === 'print') {
      try {
        const detail = await state.getAcolhidoDetail(row)
        const { openAcolhidoFichaPdf } = await import('../utils/pdfDocuments')
        await openAcolhidoFichaPdf(detail, state.sectorMap[detail.sectorId], user?.name)
        state.setToast({ message: 'PDF da ficha gerado com sucesso.', severity: 'success' })
      } catch {
        state.setToast({ message: 'Não foi possível gerar o PDF da ficha.', severity: 'error' })
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
        state.setToast({ message: 'Saida da familia registrada com sucesso.', severity: 'success' })
        return
      }

      if (saidaRow) {
        await registerAcolhidoSaida(saidaRow.apiId, toIsoDate(payload.data), tipoSaida, payload)
        state.removeRow(saidaRow.apiId)
        setSaidaOpen(false)
        setSaidaRow(null)
        state.setFichaRow(null)
        state.setToast({ message: 'Saida registrada com sucesso.', severity: 'success' })
      }
    } catch (error) {
      state.setToast({ message: getApiErrorMessage(error), severity: 'error' })
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
    state.setToast({ message: 'Etiqueta de pertences gerada com sucesso.', severity: 'success' })
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
        count={state.totalRows}
        onNew={() => { state.setEditRow(null); state.setCadastroOpen(true) }}
        onFullRegistration={() => navigate('/acolhidos/cadastros')}
      />

      <AcolhidosTable
        rows={state.filteredRows}
        sectorMap={state.sectorMap}
        page={state.page}
        pageSize={state.pageSize}
        totalRows={state.totalRows}
        onPageChange={state.setPage}
        onPageSizeChange={state.handlePageSizeChange}
        onRowClick={state.openFicha}
        onAction={handleAcolhidoAction}
      />

      <SectorHeatmap
        rows={state.heatmapRows}
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
        rows={state.rows}
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

      <Snackbar open={!!state.toast} autoHideDuration={2800} onClose={() => state.setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={state.toast?.severity ?? 'success'} onClose={() => state.setToast(null)} variant="filled" sx={{ borderRadius: 1 }}>
          {state.toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
