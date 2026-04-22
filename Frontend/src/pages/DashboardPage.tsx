import {
  AppBar,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const cards = [
  {
    title: 'Acolhimentos ativos',
    description: 'Painel inicial para monitorar famílias e indivíduos acolhidos.',
  },
  {
    title: 'Setorização',
    description: 'Visualização rápida de ocupação por setor e perfil prioritário.',
  },
  {
    title: 'Entregas de materiais',
    description: 'Resumo diário de distribuição com rastreabilidade por responsável.',
  },
]

export function DashboardPage() {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <Stack spacing={3}>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap', px: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Navegacao rapida
          </Typography>
          <Button
            component={RouterLink}
            to="/dashboard"
            variant={location.pathname === '/dashboard' ? 'contained' : 'text'}
          >
            Dashboard
          </Button>
          <Button
            component={RouterLink}
            to="/gestao"
            variant={location.pathname === '/gestao' ? 'contained' : 'text'}
          >
            Gestao
          </Button>
        </Toolbar>
      </AppBar>

      <Stack spacing={1}>
        <Typography variant="h4">Painel Inicial</Typography>
        <Typography color="text.secondary">
          Acesso autorizado para operação do sistema da Casa Abrigo Temporário.
        </Typography>
        <Chip label={`Perfil: ${user?.role ?? 'não definido'}`} sx={{ width: 'fit-content' }} />
      </Stack>

      <Grid container spacing={2}>
        {cards.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 4 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography color="text.secondary">{item.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
