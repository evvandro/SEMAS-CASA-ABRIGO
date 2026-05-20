import { useState, useEffect } from 'react'
import { Box, Typography, Button, Autocomplete, TextField, Stack, Alert, Snackbar } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { SaidaDrawer } from '../modules/acolhidos/components/SaidaDrawer'
import type { SaidaPayload, Acolhido } from '../modules/acolhidos/types'
import { fetchAcolhidos, registerAcolhidoSaida } from '../services/acolhidosService'

export function SaidasPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [acolhidos, setAcolhidos] = useState<Acolhido[]>([])
  const [selectedAcolhido, setSelectedAcolhido] = useState<Acolhido | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadAcolhidos()
  }, [])

  const loadAcolhidos = async () => {
    setLoading(true)
    try {
      const data = await fetchAcolhidos()
      // Filter only those who haven't exited yet (assuming not exited or list gives active ones)
      setAcolhidos(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDrawer = () => {
    setDrawerOpen(true)
  }

  const handleSaveSaida = async (payload: SaidaPayload) => {
    if (!selectedAcolhido) {
      setErrorMsg('Selecione um acolhido na lista antes de salvar.')
      return
    }
    try {
      // payload.data is 'dd/mm/yyyy' from the form if prepopulated.
      const isoDate = payload.data.split('/').reverse().join('-')
      
      await registerAcolhidoSaida(
        selectedAcolhido.apiId, 
        isoDate.includes('-') && isoDate.length === 10 ? isoDate : new Date().toISOString().split('T')[0], 
        payload.tipoDesligamento, 
        payload
      )
      setDrawerOpen(false)
      setSelectedAcolhido(null)
      loadAcolhidos()
      setSuccessMsg('Saída registrada com sucesso!')
    } catch (err) {
      console.error('Erro ao registrar saída:', err)
      alert('Falha ao registrar saída. Verifique os dados e tente novamente.')
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Saídas
        </Typography>
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Registrar Nova Saída
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Autocomplete
            options={acolhidos}
            getOptionLabel={(option) => `${option.name} (CPF: ${option.cpf || 'Não informado'})`}
            value={selectedAcolhido}
            onChange={(_, newValue) => setSelectedAcolhido(newValue)}
            sx={{ width: 400 }}
            renderInput={(params) => <TextField {...params} label="Selecione um Acolhido Ativo" variant="outlined" />}
            loading={loading}
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenDrawer}
          >
            Abrir Formulário de Saída
          </Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          No futuro, aqui será listado o histórico de saídas registradas.
        </Typography>
      </Box>

      <SaidaDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        onSave={handleSaveSaida} 
        initialRow={selectedAcolhido}
      />
      
      <Snackbar open={!!successMsg} autoHideDuration={6000} onClose={() => setSuccessMsg('')}>
        <Alert onClose={() => setSuccessMsg('')} severity="success" sx={{ width: '100%' }}>
          {successMsg}
        </Alert>
      </Snackbar>

      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg('')}>
        <Alert onClose={() => setErrorMsg('')} severity="error" sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  )
}

