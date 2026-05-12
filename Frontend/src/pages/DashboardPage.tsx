import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import GridViewIcon from '@mui/icons-material/GridView'
import GroupIcon from '@mui/icons-material/Group'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { api } from '../services/api'

interface DashboardSetor {
  id: number
  nome: string
  cor: string
  capacidade: number
  familias_ativas_count: number
  acolhidos_ativos_count: number
}

interface DashboardData {
  familias_ativas: number
  acolhidos_ativos: number
  entregas_hoje: number
  setores: DashboardSetor[]
}

interface DashboardResponse {
  data: DashboardData
}

function StatCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string
  value: number | string
  helper: string
  icon: ReactNode
}) {
  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.75 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get<DashboardResponse>('/dashboard')
        if (active) setDashboard(response.data.data)
      } catch {
        if (active) setError('Nao foi possivel carregar os dados do painel.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  const setores = dashboard?.setores ?? []
  const totalCapacity = setores.reduce((acc, setor) => acc + (setor.capacidade ?? 0), 0)
  const occupiedCapacity = setores.reduce((acc, setor) => acc + (setor.acolhidos_ativos_count ?? 0), 0)
  const occupancyPercent = totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0

  const orderedSetores = useMemo(
    () => [...setores].sort((a, b) => b.acolhidos_ativos_count - a.acolhidos_ativos_count),
    [setores],
  )

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={2}
      >
        <Box>
          <Typography variant="h4">Painel Inicial</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Acompanhamento dos acolhimentos ativos e da ocupacao da Casa Abrigo.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Chip label={`Perfil: ${user?.role ?? 'nao definido'}`} sx={{ width: 'fit-content' }} />
          <Button
            component={RouterLink}
            to="/acolhidos"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{ justifyContent: 'center' }}
          >
            Ver acolhidos
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Acolhimentos ativos"
            value={dashboard?.acolhidos_ativos ?? 0}
            helper="Pessoas sem registro de saida"
            icon={<GroupIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Familias ativas"
            value={dashboard?.familias_ativas ?? 0}
            helper="Familias ainda acolhidas"
            icon={<FamilyRestroomIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Ocupacao geral"
            value={totalCapacity > 0 ? `${occupancyPercent}%` : '-'}
            helper={totalCapacity > 0 ? `${occupiedCapacity} de ${totalCapacity} vagas` : 'Capacidade nao cadastrada'}
            icon={<GridViewIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Entregas hoje"
            value={dashboard?.entregas_hoje ?? 0}
            helper="Materiais entregues no dia"
            icon={<Inventory2Icon />}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Acolhimentos por setor</Typography>
            <Typography variant="body2" color="text.secondary">
              Mostra quantas pessoas ativas estao em cada setor e quanto da capacidade ja foi ocupada.
            </Typography>
          </Box>

          {orderedSetores.length > 0 ? (
            <Grid container spacing={2}>
              {orderedSetores.map((setor) => {
                const percent = setor.capacidade > 0
                  ? Math.min(Math.round((setor.acolhidos_ativos_count / setor.capacidade) * 100), 100)
                  : 0

                return (
                  <Grid key={setor.id} size={{ xs: 12, md: 6 }}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 1 }}>
                        <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
                          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: setor.cor, flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {setor.nome}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {setor.acolhidos_ativos_count}/{setor.capacidade || 0}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{
                          height: 7,
                          borderRadius: 999,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': { bgcolor: setor.cor },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {setor.familias_ativas_count} familias ativas neste setor
                      </Typography>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          ) : (
            <Typography color="text.secondary">Nenhum setor ativo encontrado.</Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
