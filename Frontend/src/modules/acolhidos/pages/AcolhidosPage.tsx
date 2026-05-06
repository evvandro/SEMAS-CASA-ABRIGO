import { Box, Typography, Snackbar, Alert } from '@mui/material'
import { AcolhidosTable } from '../components/AcolhidosTable'
import { AcolhidosToolbar } from '../components/AcolhidosToolbar'
import { CadastroDrawer } from '../components/CadastroDrawer'
import { FichaDrawer } from '../components/FichaDrawer'
import { SectorHeatmap } from '../components/SectorHeatmap'
import { useAcolhidosPageState } from '../hooks/useAcolhidosPageState'

export function AcolhidosPage() {
  const state = useAcolhidosPageState()

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
        count={state.filteredRows.length}
        onNew={() => state.setCadastroOpen(true)}
      />

      <AcolhidosTable
        rows={state.filteredRows}
        onRowClick={state.setFichaRow}
        onAction={(action, row) => action === 'view' ? state.setFichaRow(row) : state.handleAction(action, row)}
      />

      <SectorHeatmap rows={state.rows} activeSectorId={state.sectorId} onSelectSector={state.setSectorId} />

      <FichaDrawer
        row={state.fichaRow}
        onClose={() => state.setFichaRow(null)}
        onAction={(action, row) => { state.setFichaRow(null); state.handleAction(action, row) }}
      />

      <CadastroDrawer
        open={state.cadastroOpen}
        onClose={() => state.setCadastroOpen(false)}
        onSave={state.handleSave}
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
