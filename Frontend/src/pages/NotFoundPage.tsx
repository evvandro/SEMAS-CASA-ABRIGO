import { Button, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Stack spacing={2} alignItems="flex-start">
      <Typography variant="h4">Página não encontrada</Typography>
      <Typography color="text.secondary">
        A rota solicitada não existe neste ambiente.
      </Typography>
      <Button component={Link} to="/dashboard" variant="contained">
        Voltar ao painel
      </Button>
    </Stack>
  )
}
