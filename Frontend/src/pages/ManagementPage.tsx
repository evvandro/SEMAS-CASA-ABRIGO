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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import GridViewIcon from '@mui/icons-material/GridView'
import GroupIcon from '@mui/icons-material/Group'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import { Link as RouterLink } from 'react-router-dom'
import { api } from '../services/api'
import { fetchAcolhidos, fetchSetores, toSector } from '../services/acolhidosService'
import type { Acolhido, AlertCategory, Sector } from '../modules/acolhidos/types'
import { dateSortValue, formatEntryDateTime } from '../modules/acolhidos/utils/date'

interface DashboardSummary {
  familias_ativas: number
  acolhidos_ativos: number
  entregas_hoje: number
}

interface DashboardResponse {
  data: DashboardSummary
}

const alertLabels: Record<AlertCategory, string> = {
  pcd: 'PCD',
  gestante: 'Gestante',
  cronica: 'Doença crônica',
  idoso: 'Idoso 60+',
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

export function ManagementPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [rows, setRows] = useState<Acolhido[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [dashboard, acolhidos, rawSetores] = await Promise.all([
          api.get<DashboardResponse>('/dashboard'),
          fetchAcolhidos(),
          fetchSetores(),
        ])

        if (!active) return

        const builtSectors = rawSetores.map((setor) =>
          toSector(setor, acolhidos.filter((acolhido) => acolhido.sectorId === String(setor.id)).length),
        )

        setSummary(dashboard.data.data)
        setRows(acolhidos)
        setSectors(builtSectors)
      } catch {
        if (active) setError('Não foi possível carregar os indicadores de gestão.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const sectorMap = useMemo(
    () => Object.fromEntries(sectors.map((sector) => [sector.id, sector])),
    [sectors],
  )

  const alertCounts = useMemo(() => {
    return (Object.keys(alertLabels) as AlertCategory[]).reduce<Record<AlertCategory, number>>(
      (acc, category) => {
        acc[category] = rows.filter((row) => row.alerts.includes(category)).length
        return acc
      },
      { pcd: 0, gestante: 0, cronica: 0, idoso: 0 },
    )
  }, [rows])

  const totalPriorityProfiles = Object.values(alertCounts).reduce((acc, count) => acc + count, 0)
  const totalCapacity = sectors.reduce((acc, sector) => acc + sector.capacity, 0)
  const occupiedCapacity = sectors.reduce((acc, sector) => acc + sector.occupied, 0)
  const occupancyPercent = totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0

  const recentRows = useMemo(
    () =>
      [...rows]
        .sort((a, b) => dateSortValue(b.entry, b.entryTime) - dateSortValue(a.entry, a.entryTime))
        .slice(0, 6),
    [rows],
  )

  const busiestSectors = useMemo(
    () => [...sectors].sort((a, b) => b.occupied - a.occupied).slice(0, 5),
    [sectors],
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
          <Typography variant="h4" gutterBottom>
            Gestão de acolhidos
          </Typography>
          <Typography color="text.secondary">
            Indicadores de ocupação, perfis prioritários e registros recentes.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            component={RouterLink}
            to="/acolhidos"
            variant="outlined"
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
            title="Acolhidos ativos"
            value={summary?.acolhidos_ativos ?? rows.length}
            helper={`${recentRows.length} registros recentes exibidos`}
            icon={<GroupIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Famílias ativas"
            value={summary?.familias_ativas ?? 0}
            helper="Famílias sem registro de saída"
            icon={<FamilyRestroomIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Ocupação"
            value={totalCapacity > 0 ? `${occupancyPercent}%` : '-'}
            helper={totalCapacity > 0 ? `${occupiedCapacity} de ${totalCapacity} leitos` : 'Capacidade não informada'}
            icon={<GridViewIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Perfis prioritários"
            value={totalPriorityProfiles}
            helper="Soma de alertas ativos nos acolhidos"
            icon={<PriorityHighIcon />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={{ p: 2.5, height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Ocupação por setor</Typography>
                <Typography variant="body2" color="text.secondary">
                  Setores com maior volume de acolhidos ativos.
                </Typography>
              </Box>

              {busiestSectors.length > 0 ? (
                <Stack spacing={2}>
                  {busiestSectors.map((sector) => {
                    const percent = sector.capacity > 0 ? Math.min((sector.occupied / sector.capacity) * 100, 100) : 0

                    return (
                      <Box key={sector.id}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 0.75 }}>
                          <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: 0.5,
                                bgcolor: sector.color,
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {sector.name}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                            {sector.capacity > 0 ? `${sector.occupied}/${sector.capacity}` : `${sector.occupied} pessoas`}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          sx={{
                            height: 7,
                            borderRadius: 999,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': { bgcolor: sector.color },
                          }}
                        />
                      </Box>
                    )
                  })}
                </Stack>
              ) : (
                <Typography color="text.secondary">Nenhum setor ativo encontrado.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={{ p: 2.5, height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Perfis prioritários</Typography>
                <Typography variant="body2" color="text.secondary">
                  Distribuição de alertas registrados nos acolhidos ativos.
                </Typography>
              </Box>

              <Grid container spacing={1.5}>
                {(Object.keys(alertLabels) as AlertCategory[]).map((category) => (
                  <Grid key={category} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {alertLabels[category]}
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 0.5 }}>
                        {alertCounts[category]}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5} sx={{ p: 2.5 }}>
          <Box>
            <Typography variant="h6">Registros recentes</Typography>
            <Typography variant="body2" color="text.secondary">
              Últimas entradas registradas entre os acolhidos ativos.
            </Typography>
          </Box>
          <Chip label={`${rows.length} ativos`} color="primary" sx={{ width: 'fit-content' }} />
        </Stack>

        <TableContainer>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>CPF</TableCell>
                <TableCell>Setor</TableCell>
                <TableCell>Entrada</TableCell>
                <TableCell>Perfil</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentRows.length > 0 ? (
                recentRows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>{row.cpf || '-'}</TableCell>
                    <TableCell>{sectorMap[row.sectorId]?.name ?? '-'}</TableCell>
                    <TableCell>{formatEntryDateTime(row.entry, row.entryTime)}</TableCell>
                    <TableCell>
                      <Stack direction="row" gap={0.75} flexWrap="wrap">
                        {row.alerts.length > 0 ? (
                          row.alerts.map((alert) => (
                            <Chip key={alert} label={alertLabels[alert]} size="small" variant="outlined" />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Sem alertas
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography color="text.secondary">Nenhum acolhido ativo encontrado.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}
