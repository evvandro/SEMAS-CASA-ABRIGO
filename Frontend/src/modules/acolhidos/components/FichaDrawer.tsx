import { useState } from 'react'
import {
  Drawer, Box, Typography, Tabs, Tab, IconButton, Avatar, Chip,
  Divider, Button, TextField,
} from '@mui/material'
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineConnector, TimelineContent } from '@mui/lab'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import EditIcon from '@mui/icons-material/Edit'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import HistoryIcon from '@mui/icons-material/History'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import NotesIcon from '@mui/icons-material/Notes'
import AddIcon from '@mui/icons-material/Add'
import { ALERT_META } from './AlertBadges'
import { SECTOR_MAP } from '../data/sectors'
import type { Acolhido, CadastroAction } from '../types'
import { formatDateTime } from '../utils/date'

const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()

export function FichaDrawer({ row, onClose, onAction }: {
  row: Acolhido | null
  onClose: () => void
  onAction: (action: CadastroAction, row: Acolhido) => void
}) {
  const [tab, setTab] = useState(0)
  const open = !!row
  if (!row) {
    return <Drawer anchor="right" open={false} onClose={onClose} />
  }
  const sector = SECTOR_MAP[row.sectorId]

  const history = [
    { date: row.entry, title: 'Entrada na unidade', desc: `Triagem realizada · alocado em ${sector?.name}` },
    { date: row.entry, title: 'Identificação verificada', desc: 'CPF e RG conferidos por Luana Martins' },
    ...(row.alerts.includes('gestante') ? [{ date: row.entry, title: 'Encaminhamento médico', desc: 'Pré-natal — UBS Central agendado' }] : []),
    ...(row.alerts.includes('cronica')  ? [{ date: row.entry, title: 'Plano de medicação', desc: 'Medicação contínua registrada' }] : []),
    { date: row.entry, title: 'Kit de boas-vindas entregue', desc: 'Cobertor, kit higiene, alimentação' },
  ]

  const materials = [
    { name: 'Kit Higiene Pessoal', sub: 'Adulto · sabonete, escova, pasta', qty: '1 un.', date: row.entry },
    { name: 'Cobertor térmico',    sub: 'Tamanho casal',                    qty: '2 un.', date: row.entry },
    { name: 'Refeição completa',   sub: 'Almoço + jantar',                  qty: '4 un.', date: '2026-04-21T12:00' },
    ...(row.alerts.includes('cronica') ? [{ name: 'Medicação prescrita', sub: 'Hipertensão · 2x ao dia', qty: '7 dias', date: row.entry }] : []),
    ...(row.family > 1 ? [{ name: 'Kit familiar', sub: `${row.family} pessoas`, qty: '1 un.', date: row.entry }] : []),
  ]

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100vw', md: 720 } } } }}
    >
      {/* Hero */}
      <Box sx={{
        p: 3,
        borderBottom: '1px solid', borderColor: 'divider',
        position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${sector?.color} 0%, transparent 60%)`,
          opacity: 0.08,
        },
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: sector?.color, fontSize: 19, fontWeight: 600 }}>
            {initials(row.name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>{row.name}</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', color: 'text.secondary', fontSize: 12.5 }}>
              <span>📋 {row.id}</span>
              <span>🎂 {row.age} anos</span>
              <span>👥 Família de {row.family}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: sector?.color }} />
                {sector?.name} · {sector?.sub}
              </span>
            </Box>
          </Box>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        {row.alerts.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.75, mt: 2, flexWrap: 'wrap', position: 'relative' }}>
            {row.alerts.map(a => {
              const m = ALERT_META[a]
              const Icon = m.Icon
              return (
                <Chip
                  key={a}
                  size="small"
                  icon={<Icon sx={{ fontSize: 13 }} />}
                  label={m.label}
                  sx={{
                    bgcolor: `${m.color}14`, color: m.color,
                    border: '1px solid', borderColor: `${m.color}40`,
                    '& .MuiChip-icon': { color: m.color },
                  }}
                />
              )
            })}
          </Box>
        )}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Visão Geral" />
        <Tab icon={<HistoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Histórico" />
        <Tab icon={<Inventory2Icon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Entregas (${materials.length})`} />
        <Tab icon={<NotesIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Anotações" />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {tab === 0 && (
          <>
            <Subhead>Identificação</Subhead>
            <Grid2>
              <Detail label="Nome completo" value={row.name} />
              <Detail label="CPF" value={row.cpf} mono />
              <Detail label="Idade" value={`${row.age} anos`} />
              <Detail label="Prontuário" value={row.id} mono />
            </Grid2>

            <Subhead>Acolhimento</Subhead>
            <Grid2>
              <Detail label="Data de entrada" value={formatDateTime(row.entry)} />
              <Detail label="Setor" value={`${sector?.name} — ${sector?.sub}`} />
              <Detail label="Família" value={`${row.family} ${row.family > 1 ? 'pessoas' : 'pessoa'}`} />
              <Detail label="Responsável" value="Luana Martins" />
            </Grid2>

            <Subhead>Perfil prioritário</Subhead>
            {row.alerts.length === 0
              ? <Typography variant="body2" color="text.secondary">Nenhuma condição prioritária registrada.</Typography>
              : <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {row.alerts.map(a => {
                    const m = ALERT_META[a]
                    const Icon = m.Icon
                    return (
                      <Box component="li" key={a} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: m.color, color: '#fff', display: 'grid', placeItems: 'center' }}>
                          <Icon sx={{ fontSize: 12 }} />
                        </Box>
                        <Typography variant="body2">{m.label}</Typography>
                      </Box>
                    )
                  })}
                </Box>
            }
          </>
        )}

        {tab === 1 && (
          <>
            <Subhead>Linha do tempo</Subhead>
            <Timeline sx={{ p: 0, m: 0 }}>
              {history.map((h, i) => (
                <TimelineItem key={i} sx={{ '&::before': { display: 'none' } }}>
                  <TimelineSeparator>
                    <TimelineDot color="primary" sx={{ my: 0.5 }} />
                    {i < history.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{h.title}</Typography>
                    <Typography variant="caption">{h.desc}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled' }}>
                      {formatDateTime(h.date)}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </>
        )}

        {tab === 2 && (
          <>
            <Subhead>Materiais entregues</Subhead>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {materials.map((m, i) => (
                <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 2, alignItems: 'center', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{m.name}</Typography>
                    <Typography variant="caption">{m.sub}</Typography>
                  </Box>
                  <Typography variant="caption">{m.qty}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>{formatDateTime(m.date)}</Typography>
                </Box>
              ))}
            </Box>
          </>
        )}

        {tab === 3 && (
          <>
            <Subhead>Observações da equipe</Subhead>
            <Box sx={{ p: 1.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Luana Martins · Assistente Social
                </Typography>
                <Typography variant="caption">{formatDateTime(row.entry)}</Typography>
              </Box>
              <Typography variant="body2">
                Acolhimento realizado em condições adequadas. Família orientada sobre rotina da unidade.
              </Typography>
            </Box>
            <TextField multiline minRows={3} fullWidth placeholder="Adicionar nova observação…" sx={{ mt: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}>
                Adicionar nota
              </Button>
            </Box>
          </>
        )}
      </Box>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption">
          Última atualização hoje, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<PrintIcon />} onClick={() => onAction('print', row)}>Imprimir</Button>
          <Button startIcon={<EditIcon />} onClick={() => onAction('edit', row)}>Editar</Button>
          <Button variant="contained" startIcon={<LogoutIcon />} onClick={() => onAction('exit', row)}>
            Registrar saída
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

const Subhead = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="caption" sx={{
    display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
    color: 'text.disabled', pb: 1, mb: 1.5, borderBottom: '1px solid', borderColor: 'divider',
  }}>
    {children}
  </Typography>
)

const Grid2 = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 24px', mb: 3 }}>
    {children}
  </Box>
)

const Detail = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <Box>
    <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.disabled', display: 'block' }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: 13.5, fontWeight: 500, fontFamily: mono ? 'ui-monospace, monospace' : undefined }}>
      {value}
    </Typography>
  </Box>
)
