import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import EditIcon from '@mui/icons-material/Edit'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Link as RouterLink } from 'react-router-dom'
import { SectionNavigation } from '../components/SectionNavigation'

interface Pessoa {
  id: number
  nome: string
  idade: number
  cpf: string
  dataEntrada: string
  situacao: 'Ativo' | 'Em Avaliacao' | 'Transferido' | 'Desligado'
  tipo: 'Individual' | 'Familia'
  membros?: number
}

const mockPessoas: Pessoa[] = [
  {
    id: 1,
    nome: 'Maria Silva Santos',
    idade: 34,
    cpf: '123.456.789-00',
    dataEntrada: '15/01/2026',
    situacao: 'Ativo',
    tipo: 'Familia',
    membros: 3,
  },
  {
    id: 2,
    nome: 'Joao Carlos Oliveira',
    idade: 42,
    cpf: '234.567.890-11',
    dataEntrada: '28/02/2026',
    situacao: 'Ativo',
    tipo: 'Individual',
  },
  {
    id: 3,
    nome: 'Ana Paula Costa',
    idade: 28,
    cpf: '345.678.901-22',
    dataEntrada: '10/03/2026',
    situacao: 'Em Avaliacao',
    tipo: 'Familia',
    membros: 2,
  },
  {
    id: 4,
    nome: 'Pedro Henrique Souza',
    idade: 55,
    cpf: '456.789.012-33',
    dataEntrada: '05/12/2025',
    situacao: 'Ativo',
    tipo: 'Individual',
  },
  {
    id: 5,
    nome: 'Juliana Ferreira Lima',
    idade: 31,
    cpf: '567.890.123-44',
    dataEntrada: '20/01/2026',
    situacao: 'Ativo',
    tipo: 'Familia',
    membros: 4,
  },
  {
    id: 6,
    nome: 'Roberto Alves Pereira',
    idade: 48,
    cpf: '678.901.234-55',
    dataEntrada: '08/11/2025',
    situacao: 'Transferido',
    tipo: 'Individual',
  },
]

export function ManagementPage() {
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const getSituacaoColor = (situacao: Pessoa['situacao']) => {
    const colors = {
      Ativo: 'success',
      'Em Avaliacao': 'warning',
      Transferido: 'info',
      Desligado: 'error',
    } as const

    return colors[situacao]
  }

  const filteredPessoas = mockPessoas.filter((pessoa) => {
    const matchesSearch =
      pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) || pessoa.cpf.includes(searchTerm)

    const matchesTab =
      tabValue === 0 ? true : tabValue === 1 ? pessoa.tipo === 'Individual' : pessoa.tipo === 'Familia'

    return matchesSearch && matchesTab
  })

  const familiasAtivas = mockPessoas.filter((pessoa) => pessoa.tipo === 'Familia').length
  const individuaisAtivos = mockPessoas.filter((pessoa) => pessoa.tipo === 'Individual').length

  return (
    <Stack spacing={3}>
      <SectionNavigation sticky />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.12,
            )} 100%)`,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
        >
          <Stack spacing={1}>
            <Typography variant="h4">Casa Abrigo - Gestao de Acolhidos</Typography>
            <Typography color="text.secondary">
              Sistema de gerenciamento de pessoas e familias acolhidas.
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`${mockPessoas.length} acolhimentos`} color="primary" />
              <Chip label={`${familiasAtivas} familias`} variant="outlined" />
              <Chip label={`${individuaisAtivos} individuais`} variant="outlined" />
            </Stack>
          </Stack>

          <Button component={RouterLink} to="/cadastros" variant="contained" startIcon={<PersonAddIcon />}>
            Novo cadastro
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 64 }}
          >
            <Tab icon={<FamilyRestroomIcon />} iconPosition="start" label="Todos" />
            <Tab icon={<PersonIcon />} iconPosition="start" label="Individuais" />
            <Tab icon={<FamilyRestroomIcon />} iconPosition="start" label="Familias" />
          </Tabs>
        </Box>

        <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
          <TextField
            fullWidth
            placeholder="Buscar por nome ou CPF..."
            size="small"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ maxWidth: 420 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TableContainer
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <Table sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <TableCell>Nome</TableCell>
                  <TableCell>Idade</TableCell>
                  <TableCell>CPF</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Membros</TableCell>
                  <TableCell>Data de entrada</TableCell>
                  <TableCell>Situacao</TableCell>
                  <TableCell align="center">Acoes</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredPessoas.length > 0 ? (
                  filteredPessoas.map((pessoa) => (
                    <TableRow key={pessoa.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{pessoa.nome}</TableCell>
                      <TableCell>{pessoa.idade} anos</TableCell>
                      <TableCell>{pessoa.cpf}</TableCell>
                      <TableCell>
                        <Chip
                          label={pessoa.tipo}
                          size="small"
                          variant="outlined"
                          color={pessoa.tipo === 'Familia' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{pessoa.membros ? `${pessoa.membros} pessoas` : '-'}</TableCell>
                      <TableCell>{pessoa.dataEntrada}</TableCell>
                      <TableCell>
                        <Chip label={pessoa.situacao} size="small" color={getSituacaoColor(pessoa.situacao)} />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" aria-label={`Visualizar ${pessoa.nome}`}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="primary" aria-label={`Editar ${pessoa.nome}`}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary">Nenhum registro encontrado.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredPessoas.length} de {mockPessoas.length} registros.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ultima atualizacao simulada em 22/04/2026.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  )
}
