import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import AssignmentIcon from '@mui/icons-material/Assignment'
import BadgeIcon from '@mui/icons-material/Badge'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import LogoutIcon from '@mui/icons-material/Logout'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PlaceIcon from '@mui/icons-material/Place'
import { useEffect, useState, type ReactElement, type ReactNode } from 'react'
import { fetchFamiliaDetail } from '../../../services/familiasService'
import { ALERT_META } from './AlertBadges'
import type { Acolhido, AcolhidoAction, Familia, Sector } from '../types'
import { formatDateOnly, formatEntryDateTime } from '../utils/date'

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()

function valueOrFallback(value?: string | number | null) {
  const normalized = value == null ? '' : String(value).trim()
  return normalized || 'Não informado'
}

function sectorLabel(sector?: Sector) {
  if (!sector) return 'Não informado'
  return sector.sub ? `${sector.name} - ${sector.sub}` : sector.name
}

export function FichaDrawer({
  row,
  onClose,
  onAction,
  sectorMap = {},
  operatorName,
}: {
  row: Acolhido | null
  onClose: () => void
  onAction: (action: AcolhidoAction, row: Acolhido) => void
  sectorMap?: Record<string, Sector>
  operatorName?: string | null
}) {
  const open = !!row
  const [familia, setFamilia] = useState<Familia | null>(null)
  const [loadingFamilia, setLoadingFamilia] = useState(false)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      if (!row?.familyId) {
        setFamilia(null)
        setLoadingFamilia(false)
        return
      }

      setLoadingFamilia(true)
      try {
        const data = await fetchFamiliaDetail(row.familyId)
        if (active) setFamilia(data)
      } catch {
        if (active) setFamilia(null)
      } finally {
        if (active) setLoadingFamilia(false)
      }
    }
    
    loadData()

    return () => {
      active = false
    }
  }, [row?.familyId])

  if (!row) {
    return <Drawer anchor="right" open={false} onClose={onClose} />
  }

  const sector = sectorMap[row.sectorId]

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100vw', md: 720 } } } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: sector?.color ? `linear-gradient(135deg, ${sector.color} 0%, transparent 58%)` : 'none',
              opacity: 0.08,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: sector?.color ?? 'primary.main', fontSize: 19, fontWeight: 700 }}>
              {initials(row.name)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ mb: 0.75 }} noWrap>
                {row.name}
              </Typography>
              <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" color="text.secondary">
                <Meta icon={<AssignmentIndIcon />} text={row.id} />
                <Meta icon={<BadgeIcon />} text={valueOrFallback(row.cpf)} />
                <Meta icon={<EventAvailableIcon />} text={`${row.age} anos`} />
                <Meta icon={<PlaceIcon />} text={sectorLabel(sector)} />
              </Stack>
            </Box>
            <IconButton onClick={onClose} aria-label="Fechar ficha">
              <CloseIcon />
            </IconButton>
          </Box>

          {row.alerts.length > 0 ? (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 2, position: 'relative' }}>
              {row.alerts.map(alert => {
                const meta = ALERT_META[alert]
                const Icon = meta.Icon

                return (
                  <Chip
                    key={alert}
                    size="small"
                    icon={<Icon sx={{ fontSize: 13 }} />}
                    label={meta.label}
                    sx={{
                      bgcolor: `${meta.color}14`,
                      color: meta.color,
                      border: '1px solid',
                      borderColor: `${meta.color}40`,
                      '& .MuiChip-icon': { color: meta.color },
                    }}
                  />
                )
              })}
            </Stack>
          ) : null}
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Stack spacing={3}>
            <Section title="Identificação">
              <DetailGrid>
                <Detail label="Nome completo" value={row.name} />
                <Detail label="Prontuário / pulseira" value={row.id} mono />
                <Detail label="CPF" value={row.cpf} mono />
                <Detail label="Data de nascimento" value={formatDateOnly(row.birthDate, 'Não informado')} />
                <Detail label="Idade" value={`${row.age} anos`} />
                <Detail label="Gênero" value={row.gender} />
                <Detail label="Telefone" value={row.phone} />
              </DetailGrid>
            </Section>

            <Section title="Acolhimento">
              <DetailGrid>
                <Detail label="Data e hora de entrada" value={formatEntryDateTime(row.entry, row.entryTime, 'Não informado')} />
                <Detail label="Setor" value={sectorLabel(sector)} />
                <Detail label="Leito" value={row.bed} />
                <Detail label="Família / prontuário" value={row.familyCode} mono />
                <Detail label="Responsável familiar" value={row.familyResponsible} />
                <Detail label="Parentesco" value={row.kinship} />
                <Detail label="Operador atual" value={operatorName} />
              </DetailGrid>
            </Section>

            {row.familyId ? (
              <Section title="Grupo familiar">
                {loadingFamilia ? (
                  <Typography variant="body2" color="text.secondary">Carregando grupo familiar...</Typography>
                ) : familia ? (
                  <Stack spacing={1.5}>
                    <DetailGrid>
                      <Detail label="Codigo familiar" value={familia.codigo} mono />
                      <Detail label="Responsavel" value={familia.responsavelNome} />
                      <Detail label="Setor principal" value={familia.setorNome} />
                      <Detail label="Membros ativos" value={familia.acolhidosCount} />
                    </DetailGrid>
                    <Stack spacing={1}>
                      {familia.membros?.map((membro) => (
                        <Box
                          key={membro.apiId}
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{membro.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {valueOrFallback(membro.kinship)} | Leito {valueOrFallback(membro.bed)}
                            </Typography>
                          </Box>
                          <Chip size="small" color={membro.active ? 'success' : 'default'} label={membro.active ? 'Ativo' : 'Saiu'} />
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">Nao foi possivel carregar o grupo familiar.</Typography>
                )}
              </Section>
            ) : null}

            <Section title="Perfil preferencial">
              {row.alerts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma condição prioritária registrada.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {row.alerts.map(alert => {
                    const meta = ALERT_META[alert]
                    const Icon = meta.Icon

                    return (
                      <Chip
                        key={alert}
                        icon={<Icon sx={{ fontSize: 14 }} />}
                        label={meta.label}
                        variant="outlined"
                        sx={{ '& .MuiChip-icon': { color: meta.color } }}
                      />
                    )
                  })}
                </Stack>
              )}
            </Section>

            <Section title="Observações">
              <TextBlock value={row.notes} />
            </Section>

            <Section title="Pertences registrados">
              <TextBlock value={row.belongings} />
            </Section>
          </Stack>
        </Box>

        <Divider />
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            Dados do cadastro do acolhido
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button startIcon={<LocalOfferIcon />} onClick={() => onAction('label', row)}>
              Etiqueta
            </Button>
            <Button startIcon={<PictureAsPdfIcon />} onClick={() => onAction('print', row)}>
              PDF da ficha
            </Button>
            <Button startIcon={<Inventory2Icon />} onClick={() => onAction('deliver', row)}>
              Entregar item
            </Button>
            <Button startIcon={<EditIcon />} onClick={() => onAction('edit', row)}>
              Editar rápido
            </Button>
            <Button startIcon={<AssignmentIcon />} onClick={() => onAction('editFull', row)}>
              Ficha detalhada
            </Button>
            <Button variant="contained" startIcon={<LogoutIcon />} onClick={() => onAction('exit', row)}>
              Registrar saída
            </Button>
            {row.familyId ? (
              <Button color="warning" variant="contained" startIcon={<LogoutIcon />} onClick={() => onAction('exitFamily', row)}>
                Registrar saida da familia
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  )
}

function Meta({ icon, text }: { icon: ReactElement; text: string }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12.5, '& svg': { fontSize: 15 } }}>
      {icon}
      <span>{text}</span>
    </Box>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'text.secondary',
          pb: 1,
          mb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function DetailGrid({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: '14px 24px' }}>
      {children}
    </Box>
  )
}

function Detail({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.disabled', display: 'block' }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 500, fontFamily: mono ? 'ui-monospace, monospace' : undefined }}>
        {valueOrFallback(value)}
      </Typography>
    </Box>
  )
}

function TextBlock({ value }: { value?: string | null }) {
  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {valueOrFallback(value)}
      </Typography>
    </Box>
  )
}
