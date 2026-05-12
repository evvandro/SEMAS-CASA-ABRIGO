import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { AcolhidosTable } from '../components/AcolhidosTable'
import { AcolhidosToolbar } from '../components/AcolhidosToolbar'
import { CadastroDrawer } from '../components/CadastroDrawer'
import { FichaDrawer } from '../components/FichaDrawer'
import { SectorHeatmap } from '../components/SectorHeatmap'
import { useAcolhidosPageState } from '../hooks/useAcolhidosPageState'

export function AcolhidosPage() {
  const state = useAcolhidosPageState()
  const navigate = useNavigate()

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
        onNew={() => state.setCadastroOpen(true)}
        onFullRegistration={() => navigate('/acolhidos/cadastros')}
      />

      <AcolhidosTable
        rows={state.filteredRows}
        sectorMap={state.sectorMap}
        onRowClick={state.setFichaRow}
        onAction={(action, row) => action === 'view' ? state.setFichaRow(row) : state.handleAction(action, row)}
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
        onAction={(action, row) => { state.setFichaRow(null); state.handleAction(action, row) }}
      />

      <CadastroDrawer
        open={state.cadastroOpen}
        onClose={() => state.setCadastroOpen(false)}
        onSave={state.handleSave}
        sectors={state.sectors}
      />

      <Snackbar open={!!state.toast} autoHideDuration={2800} onClose={() => state.setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => state.setToast(null)} variant="filled" sx={{ borderRadius: 1 }}>
          {state.toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}
