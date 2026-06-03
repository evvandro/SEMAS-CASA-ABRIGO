import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
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
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import SaveIcon from '@mui/icons-material/Save'
import { TimeInput } from '../components/TimeInput'
import { scrollAppContentToTop } from '../utils/scrollAppContent'
import { showErrorToast, showSuccessToast } from '../utils/notificationService'
import { api } from '../services/api'

interface Material {
  id: number
  nome: string
  unidade: string
  categoria: string
  estoque_atual: number
}

interface RecebimentoItem {
  categoria: string
  descricao: string
  quantidade: number
  unidade: string
  condicao: 'novo' | 'usado'
  observacoes: string
}

interface Recebimento {
  id: number
  data_recebimento: string
  hora_recebimento: string
  origem: string
  doador_nome: string
  recebido_por: string
  itens: RecebimentoItem[]
}

interface FormState {
  nome_abrigo: string
  municipio_uf: string
  orgao_responsavel: string
  data_recebimento: string
  hora_recebimento: string
  origem: string
  origem_outro: string
  doador_nome: string
  doador_documento: string
  doador_contato: string
  conferido: string
  motivo_nao_conferido: string
  possui_restricao: string
  restricao_descricao: string
  destinacao_inicial: string
  local_armazenamento: string
  recebido_por: string
  funcao_equipe: string
  entregue_por: string
  observacoes_gerais: string
}

const categorias = ['Higiene pessoal', 'Alimentos', 'Limpeza', 'Colchoes', 'Roupas', 'Cobertas', 'Outros']
const origens = ['Doacao pessoa fisica', 'Doacao empresa', 'Defesa Civil', 'Orgao publico', 'ONG / Entidade', 'Outro']
const unidades = ['unidade', 'kit', 'caixa', 'pacote', 'kg', 'litro', 'par']

const today = new Date().toISOString().slice(0, 10)
const now = new Date().toTimeString().slice(0, 5)

const emptyForm: FormState = {
  nome_abrigo: 'Abrigo Temporario',
  municipio_uf: '',
  orgao_responsavel: '',
  data_recebimento: today,
  hora_recebimento: now,
  origem: 'Doacao pessoa fisica',
  origem_outro: '',
  doador_nome: '',
  doador_documento: '',
  doador_contato: '',
  conferido: 'sim',
  motivo_nao_conferido: '',
  possui_restricao: 'nao',
  restricao_descricao: '',
  destinacao_inicial: 'estoque',
  local_armazenamento: '',
  recebido_por: '',
  funcao_equipe: '',
  entregue_por: '',
  observacoes_gerais: '',
}

const emptyItem: RecebimentoItem = {
  categoria: 'Higiene pessoal',
  descricao: '',
  quantidade: 1,
  unidade: 'unidade',
  condicao: 'novo',
  observacoes: '',
}

export function EstoquePage() {
  const [materiais, setMateriais] = useState<Material[]>([])
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [itens, setItens] = useState<RecebimentoItem[]>([{ ...emptyItem }])
  const [activeView, setActiveView] = useState<'listagem' | 'cadastro'>('listagem')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const [materiaisResponse, recebimentosResponse] = await Promise.all([
        api.get<{ data: Material[] }>('/materiais'),
        api.get<{ data: Recebimento[] }>('/recebimentos-materiais'),
      ])

      setMateriais(materiaisResponse.data.data)
      setRecebimentos(recebimentosResponse.data.data)
    } catch {
      setError('Nao foi possivel carregar o estoque.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const totalItens = materiais.reduce((acc, material) => acc + material.estoque_atual, 0)
  const categoriasAtivas = new Set(materiais.map((material) => material.categoria)).size
  const baixoEstoque = materiais.filter((material) => material.estoque_atual <= 5).length

  const materiaisPorCategoria = useMemo(() => {
    return categorias.map((categoria) => ({
      categoria,
      quantidade: materiais
        .filter((material) => material.categoria === categoria)
        .reduce((acc, material) => acc + material.estoque_atual, 0),
    }))
  }, [materiais])

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const setItem = (index: number, field: keyof RecebimentoItem, value: string | number) => {
    setItens((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    )
  }

  const removeItem = (index: number) => {
    setItens((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const submit = async () => {
    const validItems = itens.filter((item) => item.descricao.trim() && item.quantidade > 0)

    if (!form.municipio_uf || !form.orgao_responsavel || !form.doador_nome || !form.recebido_por || validItems.length === 0) {
      setError('Preencha os dados obrigatorios e pelo menos um item recebido.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await api.post('/recebimentos-materiais', {
        ...form,
        conferido: form.conferido === 'sim',
        possui_restricao: form.possui_restricao === 'sim',
        itens: validItems,
      })

      setForm({ ...emptyForm, data_recebimento: today, hora_recebimento: now })
      setItens([{ ...emptyItem }])
      await load()
      setActiveView('listagem')
      scrollAppContentToTop()
      showSuccessToast('Recebimento registrado', 'Estoque atualizado com sucesso.')
    } catch {
      const failureMessage = 'Nao foi possivel salvar o recebimento.'
      setError(failureMessage)
      scrollAppContentToTop()
      showErrorToast('Erro ao salvar recebimento', failureMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
        <Box>
          <Typography variant="h4">Estoque</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Recebimento de materiais e controle de saldo disponivel.
          </Typography>
        </Box>
        <Chip icon={<Inventory2Icon />} label={`${totalItens} itens em estoque`} color="primary" sx={{ width: 'fit-content' }} />
      </Stack>

      {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard title="Saldo total" value={totalItens} helper="Soma das quantidades cadastradas" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard title="Categorias com estoque" value={categoriasAtivas} helper="Grupos com materiais ativos" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard title="Baixo estoque" value={baixoEstoque} helper="Materiais com 5 unidades ou menos" />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={activeView}
          onChange={(_, value: 'listagem' | 'cadastro') => setActiveView(value)}
          sx={{ px: 2, minHeight: 48, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label="Listagem" value="listagem" />
          <Tab label="Cadastro" value="cadastro" />
        </Tabs>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }} sx={{ display: activeView === 'cadastro' ? 'block' : 'none' }}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6">Formulario de recebimento</Typography>
                <Typography variant="body2" color="text.secondary">
                  Abrigo Temporario - Situacao de Emergencia / Calamidade Publica
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Nome do abrigo" value={form.nome_abrigo} onChange={(e) => setField('nome_abrigo', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Municipio/UF" value={form.municipio_uf} onChange={(e) => setField('municipio_uf', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Orgao responsavel" value={form.orgao_responsavel} onChange={(e) => setField('orgao_responsavel', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField label="Data" type="date" value={form.data_recebimento} onChange={(e) => setField('data_recebimento', e.target.value)} fullWidth required slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TimeInput label="Hora" value={form.hora_recebimento} onChange={(value) => setField('hora_recebimento', value)} required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField select label="Origem dos materiais" value={form.origem} onChange={(e) => setField('origem', e.target.value)} fullWidth>
                    {origens.map((origem) => <MenuItem key={origem} value={origem}>{origem}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label="Outro" value={form.origem_outro} onChange={(e) => setField('origem_outro', e.target.value)} fullWidth disabled={form.origem !== 'Outro'} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Nome do doador / instituicao" value={form.doador_nome} onChange={(e) => setField('doador_nome', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="CPF/CNPJ" value={form.doador_documento} onChange={(e) => setField('doador_documento', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Telefone/contato" value={form.doador_contato} onChange={(e) => setField('doador_contato', e.target.value)} fullWidth />
                </Grid>
              </Grid>

              <Divider />

              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                  <Typography variant="subtitle1" fontWeight={600}>Relacao de materiais recebidos</Typography>
                  <Button startIcon={<AddIcon />} onClick={() => setItens((current) => [...current, { ...emptyItem }])}>
                    Adicionar item
                  </Button>
                </Stack>

                {itens.map((item, index) => (
                  <Grid key={index} container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField select label="Categoria" value={item.categoria} onChange={(e) => setItem(index, 'categoria', e.target.value)} fullWidth>
                        {categorias.map((categoria) => <MenuItem key={categoria} value={categoria}>{categoria}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField label="Descricao do item" value={item.descricao} onChange={(e) => setItem(index, 'descricao', e.target.value)} fullWidth required />
                    </Grid>
                    <Grid size={{ xs: 6, md: 1.3 }}>
                      <TextField label="Qtd." type="number" value={item.quantidade} onChange={(e) => setItem(index, 'quantidade', Number(e.target.value))} fullWidth slotProps={{ htmlInput: { min: 1 } }} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 1.7 }}>
                      <TextField select label="Unidade" value={item.unidade} onChange={(e) => setItem(index, 'unidade', e.target.value)} fullWidth>
                        {unidades.map((unidade) => <MenuItem key={unidade} value={unidade}>{unidade}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 8, md: 1.5 }}>
                      <TextField select label="Condicao" value={item.condicao} onChange={(e) => setItem(index, 'condicao', e.target.value)} fullWidth>
                        <MenuItem value="novo">Novo</MenuItem>
                        <MenuItem value="usado">Usado</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField label="Observacoes" value={item.observacoes} onChange={(e) => setItem(index, 'observacoes', e.target.value)} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 4, md: 0.5 }}>
                      <IconButton aria-label="Remover item" onClick={() => removeItem(index)} disabled={itens.length === 1}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Stack>

              <Divider />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField select label="Conferido?" value={form.conferido} onChange={(e) => setField('conferido', e.target.value)} fullWidth>
                    <MenuItem value="sim">Sim</MenuItem>
                    <MenuItem value="nao">Nao</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label="Motivo" value={form.motivo_nao_conferido} onChange={(e) => setField('motivo_nao_conferido', e.target.value)} fullWidth disabled={form.conferido === 'sim'} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField select label="Restricao ou validade proxima?" value={form.possui_restricao} onChange={(e) => setField('possui_restricao', e.target.value)} fullWidth>
                    <MenuItem value="nao">Nao</MenuItem>
                    <MenuItem value="sim">Sim</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label="Descrever restricao" value={form.restricao_descricao} onChange={(e) => setField('restricao_descricao', e.target.value)} fullWidth disabled={form.possui_restricao === 'nao'} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField select label="Destinacao inicial" value={form.destinacao_inicial} onChange={(e) => setField('destinacao_inicial', e.target.value)} fullWidth>
                    <MenuItem value="estoque">Armazenamento em estoque</MenuItem>
                    <MenuItem value="distribuicao_imediata">Distribuicao imediata</MenuItem>
                    <MenuItem value="setor_especifico">Encaminhado para setor especifico</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField label="Local de armazenamento/setor" value={form.local_armazenamento} onChange={(e) => setField('local_armazenamento', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Recebido por" value={form.recebido_por} onChange={(e) => setField('recebido_por', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Funcao/equipe" value={form.funcao_equipe} onChange={(e) => setField('funcao_equipe', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Entregue por" value={form.entregue_por} onChange={(e) => setField('entregue_por', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField label="Observacoes gerais" value={form.observacoes_gerais} onChange={(e) => setField('observacoes_gerais', e.target.value)} multiline minRows={3} fullWidth />
                </Grid>
              </Grid>

              <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained" startIcon={<SaveIcon />} onClick={submit} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar recebimento'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }} sx={{ display: activeView === 'listagem' ? 'block' : 'none' }}>
          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>Estoque por categoria</Typography>
              <Stack spacing={1.5}>
                {materiaisPorCategoria.map((item) => (
                  <Stack key={item.categoria} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{item.categoria}</Typography>
                    <Chip label={item.quantidade} size="small" />
                  </Stack>
                ))}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6">Materiais em estoque</Typography>
              </Box>
              <TableContainer>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell>Categoria</TableCell>
                      <TableCell align="right">Qtd.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={3}>Carregando...</TableCell></TableRow>
                    ) : materiais.map((material) => (
                      <TableRow key={material.id} hover>
                        <TableCell>{material.nome}</TableCell>
                        <TableCell>{material.categoria}</TableCell>
                        <TableCell align="right">{material.estoque_atual} {material.unidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ display: activeView === 'listagem' ? 'block' : 'none', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6">Ultimos recebimentos</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Origem</TableCell>
                <TableCell>Doador/instituicao</TableCell>
                <TableCell>Recebido por</TableCell>
                <TableCell align="right">Itens</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recebimentos.map((recebimento) => (
                <TableRow key={recebimento.id} hover>
                  <TableCell>{new Date(`${recebimento.data_recebimento}T00:00:00`).toLocaleDateString('pt-BR')} {recebimento.hora_recebimento}</TableCell>
                  <TableCell>{recebimento.origem}</TableCell>
                  <TableCell>{recebimento.doador_nome}</TableCell>
                  <TableCell>{recebimento.recebido_por}</TableCell>
                  <TableCell align="right">{recebimento.itens.length}</TableCell>
                </TableRow>
              ))}
              {!loading && recebimentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">Nenhum recebimento registrado.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}

function MetricCard({ title, value, helper }: { title: string; value: number; helper: string }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h4" sx={{ mt: 0.75 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{helper}</Typography>
      </CardContent>
    </Card>
  )
}
