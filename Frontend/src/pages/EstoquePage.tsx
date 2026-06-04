import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import CategoryIcon from '@mui/icons-material/Category'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import HistoryIcon from '@mui/icons-material/History'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import LowPriorityIcon from '@mui/icons-material/LowPriority'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import SaveIcon from '@mui/icons-material/Save'
import SearchIcon from '@mui/icons-material/Search'
import SendIcon from '@mui/icons-material/Send'
import { TimeInput } from '../components/TimeInput'
import { scrollAppContentToTop } from '../utils/scrollAppContent'
import { showErrorToast, showSuccessToast } from '../utils/notificationService'
import { fetchAcolhidos } from '../services/acolhidosService'
import { fetchFamilias } from '../services/familiasService'
import {
  createEntregaLote,
  createRecebimento,
  fetchEntregas,
  fetchMateriais,
  fetchRecebimentos,
} from '../services/estoqueService'
import type { Entrega, EntregaDestinoTipo, Recebimento } from '../services/estoqueService'
import type { Acolhido, Familia } from '../modules/acolhidos/types'

interface Material {
  id: number
  nome: string
  unidade: string
  categoria: string
  estoque_atual: number
}

type SaldoFilter = 'todos' | 'disponivel' | 'baixo' | 'zerado'

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

interface DistribuicaoForm {
  data_entrega: string
  finalidade: string
  observacoes: string
  externo_nome: string
  externo_documento: string
  externo_contato: string
  externo_instituicao: string
}

interface RecebimentoItemForm {
  material: Material | null
  quantidade: number
  condicao: 'novo' | 'usado'
  observacoes: string
}

interface CartItem {
  material: Material | null
  quantidade: number
}

interface ReadyCartItem {
  material: Material
  quantidade: number
}

interface EntregaGrupo {
  id: string
  data: string
  destinoTipo: EntregaDestinoTipo | null
  destino: string
  finalidade: string | null
  observacoes: string | null
  entreguePor: string
  itens: Entrega[]
  totalItens: number
}

const today = new Date().toISOString().slice(0, 10)
const now = new Date().toTimeString().slice(0, 5)

const emptyForm: FormState = {
  nome_abrigo: 'Abrigo Temporario',
  municipio_uf: '',
  orgao_responsavel: '',
  data_recebimento: today,
  hora_recebimento: now,
  origem: '',
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

const emptyItem: RecebimentoItemForm = {
  material: null,
  quantidade: 1,
  condicao: 'novo',
  observacoes: '',
}

const emptyDistribuicaoForm: DistribuicaoForm = {
  data_entrega: today,
  finalidade: '',
  observacoes: '',
  externo_nome: '',
  externo_documento: '',
  externo_contato: '',
  externo_instituicao: '',
}

const emptyCartItem: CartItem = {
  material: null,
  quantidade: 1,
}

export function EstoquePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [materiais, setMateriais] = useState<Material[]>([])
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [acolhidos, setAcolhidos] = useState<Acolhido[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [itens, setItens] = useState<RecebimentoItemForm[]>([{ ...emptyItem }])
  const [destinoTipo, setDestinoTipo] = useState<EntregaDestinoTipo>('acolhido')
  const [selectedAcolhido, setSelectedAcolhido] = useState<Acolhido | null>(null)
  const [selectedFamilia, setSelectedFamilia] = useState<Familia | null>(null)
  const [distribuicaoForm, setDistribuicaoForm] = useState<DistribuicaoForm>(emptyDistribuicaoForm)
  const [carrinho, setCarrinho] = useState<CartItem[]>([{ ...emptyCartItem }])
  const [recebimentoOpen, setRecebimentoOpen] = useState(false)
  const [distribuicaoOpen, setDistribuicaoOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [saldoFilter, setSaldoFilter] = useState<SaldoFilter>('todos')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [distributing, setDistributing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const [materiaisData, recebimentosData, entregasData, acolhidosData, familiasData] = await Promise.all([
        fetchMateriais(),
        fetchRecebimentos(),
        fetchEntregas(),
        fetchAcolhidos(),
        fetchFamilias(),
      ])

      setMateriais(materiaisData)
      setRecebimentos(recebimentosData)
      setEntregas(entregasData)
      setAcolhidos(acolhidosData)
      setFamilias(familiasData)
    } catch {
      setError('Não foi possível carregar o estoque.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const acolhidoParam = searchParams.get('acolhido')
    const materialParam = searchParams.get('material')
    let applied = false

    if (acolhidoParam && acolhidos.length > 0) {
      const acolhido = acolhidos.find((item) => item.apiId === Number(acolhidoParam))
      if (acolhido) {
        setDestinoTipo('acolhido')
        setSelectedAcolhido(acolhido)
        setSelectedFamilia(null)
        applied = true
      }
    }

    if (materialParam && materiais.length > 0) {
      const material = materiais.find((item) => item.id === Number(materialParam))
      if (material) {
        prefillMaterial(material)
        applied = true
      }
    }

    if (applied) {
      setDistribuicaoOpen(true)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('acolhido')
      nextParams.delete('material')
      setSearchParams(nextParams, { replace: true })
    }
  }, [acolhidos, materiais, searchParams, setSearchParams])

  const totalItens = materiais.reduce((acc, material) => acc + material.estoque_atual, 0)
  const categoriasAtivas = new Set(materiais.map((material) => material.categoria)).size
  const baixoEstoque = materiais.filter((material) => material.estoque_atual > 0 && material.estoque_atual <= 5).length
  const distribuicoesHoje = entregas.filter((entrega) => entrega.data_entrega === today).length

  const categoriasDisponiveis = useMemo(() => {
    return uniqueSorted([
      ...materiais.map((material) => material.categoria),
      ...recebimentos.flatMap((recebimento) => recebimento.itens.map((item) => item.categoria)),
    ])
  }, [materiais, recebimentos])

  const origensDisponiveis = useMemo(() => {
    return uniqueSorted(recebimentos.map((recebimento) => recebimento.origem))
  }, [recebimentos])

  const materiaisFiltrados = useMemo(() => {
    const query = search.trim().toLowerCase()

    return materiais.filter((material) => {
      if (query && !`${material.nome} ${material.categoria} ${material.unidade}`.toLowerCase().includes(query)) return false
      if (categoriaFilter && material.categoria !== categoriaFilter) return false
      if (saldoFilter === 'disponivel' && material.estoque_atual <= 0) return false
      if (saldoFilter === 'baixo' && (material.estoque_atual <= 0 || material.estoque_atual > 5)) return false
      if (saldoFilter === 'zerado' && material.estoque_atual !== 0) return false
      return true
    })
  }, [materiais, search, categoriaFilter, saldoFilter])

  const gruposEntrega = useMemo(() => groupEntregas(entregas), [entregas])
  const historicoRecente = gruposEntrega.slice(0, 6)
  const readyCartItems = carrinho.filter(isReadyCartItem)
  const cartTotal = readyCartItems.reduce((acc, item) => acc + item.quantidade, 0)
  const hasFilters = !!search || !!categoriaFilter || saldoFilter !== 'todos'

  const clearFilters = () => {
    setSearch('')
    setCategoriaFilter('')
    setSaldoFilter('todos')
  }

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const setDistribuicaoField = (field: keyof DistribuicaoForm, value: string) => {
    setDistribuicaoForm((current) => ({ ...current, [field]: value }))
  }

  const setItem = (index: number, patch: Partial<RecebimentoItemForm>) => {
    setItens((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    )
  }

  const removeItem = (index: number) => {
    setItens((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const setCartItem = (index: number, patch: Partial<CartItem>) => {
    setCarrinho((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )))
  }

  const removeCartItem = (index: number) => {
    setCarrinho((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index)
      return next.length > 0 ? next : [{ ...emptyCartItem }]
    })
  }

  const prefillMaterial = (material: Material) => {
    setCarrinho((current) => {
      if (current.some((item) => item.material?.id === material.id)) return current
      const filled = current.filter((item) => item.material)
      return [...filled, { material, quantidade: 1 }]
    })
  }

  const openDistribuicaoForMaterial = (material: Material) => {
    prefillMaterial(material)
    setDistribuicaoOpen(true)
  }

  const openDistribuicao = () => {
    setDistribuicaoOpen(true)
  }

  const handleDestinoChange = (_: unknown, value: EntregaDestinoTipo | null) => {
    if (!value) return
    setDestinoTipo(value)
    if (value !== 'acolhido') setSelectedAcolhido(null)
    if (value !== 'familia') setSelectedFamilia(null)
  }

  const submitRecebimento = async () => {
    const validItems = itens.filter(isReadyRecebimentoItem)

    if (!form.nome_abrigo.trim() || !form.municipio_uf || !form.orgao_responsavel || !form.origem.trim() || !form.doador_nome || !form.recebido_por || validItems.length === 0) {
      setError('Preencha os dados obrigatórios e selecione pelo menos um material com quantidade.')
      return
    }

    if (form.conferido === 'nao' && !form.motivo_nao_conferido.trim()) {
      setError('Informe o motivo de o material não ter sido conferido.')
      return
    }

    if (form.possui_restricao === 'sim' && !form.restricao_descricao.trim()) {
      setError('Descreva a restrição ou validade próxima do material.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await createRecebimento({
        ...form,
        origem: form.origem.trim(),
        origem_outro: form.origem_outro.trim(),
        doador_nome: form.doador_nome.trim(),
        doador_documento: form.doador_documento.trim(),
        doador_contato: form.doador_contato.trim(),
        local_armazenamento: form.local_armazenamento.trim(),
        recebido_por: form.recebido_por.trim(),
        funcao_equipe: form.funcao_equipe.trim(),
        entregue_por: form.entregue_por.trim(),
        observacoes_gerais: form.observacoes_gerais.trim(),
        conferido: form.conferido === 'sim',
        possui_restricao: form.possui_restricao === 'sim',
        itens: validItems.map((item) => ({
          material_id: item.material.id,
          quantidade: item.quantidade,
          condicao: item.condicao,
          observacoes: item.observacoes.trim(),
        })),
      })

      setForm({ ...emptyForm, data_recebimento: today, hora_recebimento: now })
      setItens([{ ...emptyItem }])
      setRecebimentoOpen(false)
      await load()
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

  const submitDistribuicao = async () => {
    const readyItems = carrinho.filter(isReadyCartItem)

    if (!distribuicaoForm.data_entrega) {
      setError('Informe a data da distribuição.')
      return
    }

    if (destinoTipo === 'acolhido' && !selectedAcolhido) {
      setError('Selecione uma pessoa acolhida ativa.')
      return
    }

    if (destinoTipo === 'familia' && !selectedFamilia) {
      setError('Selecione uma família ativa.')
      return
    }

    if (destinoTipo === 'externo' && !distribuicaoForm.externo_nome.trim()) {
      setError('Informe o destinatário externo.')
      return
    }

    if (readyItems.length === 0) {
      setError('Adicione pelo menos um material ao carrinho.')
      return
    }

    const overStock = findOverStockItem(readyItems)
    if (overStock) {
      setError(`Saldo insuficiente para ${overStock.material.nome}. Disponível: ${overStock.material.estoque_atual} ${overStock.material.unidade}.`)
      return
    }

    setDistributing(true)
    setError(null)

    try {
      await createEntregaLote({
        data_entrega: distribuicaoForm.data_entrega,
        destino_tipo: destinoTipo,
        acolhido_id: destinoTipo === 'acolhido' ? selectedAcolhido?.apiId ?? null : null,
        familia_id: destinoTipo === 'familia' ? selectedFamilia?.id ?? null : null,
        externo_nome: destinoTipo === 'externo' ? distribuicaoForm.externo_nome.trim() : null,
        externo_documento: destinoTipo === 'externo' ? distribuicaoForm.externo_documento.trim() || null : null,
        externo_contato: destinoTipo === 'externo' ? distribuicaoForm.externo_contato.trim() || null : null,
        externo_instituicao: destinoTipo === 'externo' ? distribuicaoForm.externo_instituicao.trim() || null : null,
        finalidade: distribuicaoForm.finalidade.trim() || null,
        observacoes: distribuicaoForm.observacoes.trim() || null,
        itens: readyItems.map((item) => ({
          material_id: item.material.id,
          quantidade: item.quantidade,
        })),
      })

      setToast('Distribuição registrada e estoque atualizado.')
      setCarrinho([{ ...emptyCartItem }])
      setSelectedAcolhido(null)
      setSelectedFamilia(null)
      setDistribuicaoForm({ ...emptyDistribuicaoForm, data_entrega: today })
      setDistribuicaoOpen(false)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível registrar a distribuição.'))
    } finally {
      setDistributing(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
        <Box>
          <Typography variant="h4">Estoque</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Controle operacional de materiais, recebimentos e distribuições.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setRecebimentoOpen(true)} sx={{ justifyContent: 'center' }}>
            Novo recebimento
          </Button>
          <Button variant="contained" startIcon={<SendIcon />} onClick={openDistribuicao} sx={{ justifyContent: 'center' }}>
            Nova distribuição
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard title="Saldo total" value={totalItens} helper="Unidades disponíveis" icon={<Inventory2Icon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard title="Materiais" value={materiais.length} helper={`${categoriasAtivas} categorias ativas`} icon={<CategoryIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard title="Baixo estoque" value={baixoEstoque} helper="Saldo entre 1 e 5" icon={<LowPriorityIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard title="Distribuições hoje" value={distribuicoesHoje} helper="Linhas de entrega no dia" icon={<HistoryIcon />} />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', borderRadius: 2 }}>
        <TextField
          placeholder="Buscar material, categoria ou unidade..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 240, maxWidth: 420 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ width: 1, height: 22, bgcolor: 'divider' }} />

        <Select
          size="small"
          value={categoriaFilter}
          displayEmpty
          onChange={(event) => setCategoriaFilter(event.target.value)}
          sx={{ minWidth: 190, borderRadius: 999, '& .MuiSelect-select': { py: 0.6 } }}
        >
          <MenuItem value="">Todas as categorias</MenuItem>
          {categoriasDisponiveis.map((categoria) => (
            <MenuItem key={categoria} value={categoria}>{categoria}</MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          value={saldoFilter}
          onChange={(event) => setSaldoFilter(event.target.value as SaldoFilter)}
          sx={{ minWidth: 170, borderRadius: 999, '& .MuiSelect-select': { py: 0.6 } }}
        >
          <MenuItem value="todos">Todos os saldos</MenuItem>
          <MenuItem value="disponivel">Disponíveis</MenuItem>
          <MenuItem value="baixo">Baixo estoque</MenuItem>
          <MenuItem value="zerado">Zerados</MenuItem>
        </Select>

        {hasFilters ? (
          <Button size="small" color="inherit" startIcon={<CloseIcon sx={{ fontSize: 14 }} />} onClick={clearFilters}>
            Limpar
          </Button>
        ) : null}

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="caption">
            {materiaisFiltrados.length} {materiaisFiltrados.length === 1 ? 'material' : 'materiais'}
          </Typography>
          <Button variant="contained" startIcon={<AddShoppingCartIcon />} onClick={openDistribuicao}>
            Distribuir
          </Button>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">Materiais em estoque</Typography>
          <Typography variant="body2" color="text.secondary">
            Saldos disponíveis para distribuição.
          </Typography>
        </Box>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Unidade</TableCell>
                <TableCell align="right">Saldo</TableCell>
                <TableCell align="right">Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5}>Carregando...</TableCell></TableRow>
              ) : materiaisFiltrados.map((material) => (
                <TableRow key={material.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{material.nome}</Typography>
                  </TableCell>
                  <TableCell>{material.categoria}</TableCell>
                  <TableCell>{material.unidade}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      color={material.estoque_atual === 0 ? 'default' : material.estoque_atual <= 5 ? 'warning' : 'success'}
                      variant={material.estoque_atual === 0 ? 'outlined' : 'filled'}
                      label={material.estoque_atual}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<SendIcon />}
                      onClick={() => openDistribuicaoForMaterial(material)}
                      disabled={material.estoque_atual <= 0}
                    >
                      Distribuir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && materiaisFiltrados.length === 0 ? (
                <EmptyRow colSpan={5} text="Nenhum material encontrado." />
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">Histórico recente</Typography>
          <Typography variant="body2" color="text.secondary">
            Últimas distribuições agrupadas por operação.
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Itens</TableCell>
                <TableCell>Finalidade</TableCell>
                <TableCell>Responsável</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historicoRecente.map((grupo) => (
                <TableRow key={grupo.id} hover>
                  <TableCell>{formatDate(grupo.data)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{grupo.destino}</Typography>
                    <Chip size="small" label={destinoTipoLabel(grupo.destinoTipo)} sx={{ mt: 0.75 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{grupo.itens.length} material(is)</Typography>
                    <Typography variant="caption" color="text.secondary">{grupo.totalItens} unidade(s)</Typography>
                  </TableCell>
                  <TableCell>{valueOrFallback(grupo.finalidade)}</TableCell>
                  <TableCell>{grupo.entreguePor}</TableCell>
                </TableRow>
              ))}
              {!loading && historicoRecente.length === 0 ? (
                <EmptyRow colSpan={5} text="Nenhuma distribuição registrada." />
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <RecebimentoDrawer
        open={recebimentoOpen}
        form={form}
        itens={itens}
        materiais={materiais}
        origemOptions={origensDisponiveis}
        submitting={submitting}
        onClose={() => setRecebimentoOpen(false)}
        onField={setField}
        onItem={setItem}
        onAddItem={() => setItens((current) => [...current, { ...emptyItem }])}
        onRemoveItem={removeItem}
        onSubmit={submitRecebimento}
      />

      <DistribuicaoDrawer
        open={distribuicaoOpen}
        materiais={materiais}
        acolhidos={acolhidos}
        familias={familias}
        destinoTipo={destinoTipo}
        selectedAcolhido={selectedAcolhido}
        selectedFamilia={selectedFamilia}
        form={distribuicaoForm}
        carrinho={carrinho}
        readyCount={readyCartItems.length}
        cartTotal={cartTotal}
        loading={loading}
        distributing={distributing}
        recebimentos={recebimentos}
        onClose={() => setDistribuicaoOpen(false)}
        onDestino={handleDestinoChange}
        onAcolhido={setSelectedAcolhido}
        onFamilia={setSelectedFamilia}
        onField={setDistribuicaoField}
        onCartItem={setCartItem}
        onAddCartItem={() => setCarrinho((current) => [...current, { ...emptyCartItem }])}
        onRemoveCartItem={removeCartItem}
        onSubmit={submitDistribuicao}
      />

      <Snackbar open={!!toast} autoHideDuration={2800} onClose={() => setToast(null)}>
        <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Stack>
  )
}

function MetricCard({
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
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" sx={{ mt: 0.75 }}>{value}</Typography>
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
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{helper}</Typography>
      </CardContent>
    </Card>
  )
}

function RecebimentoDrawer({
  open,
  form,
  itens,
  materiais,
  origemOptions,
  submitting,
  onClose,
  onField,
  onItem,
  onAddItem,
  onRemoveItem,
  onSubmit,
}: {
  open: boolean
  form: FormState
  itens: RecebimentoItemForm[]
  materiais: Material[]
  origemOptions: string[]
  submitting: boolean
  onClose: () => void
  onField: (field: keyof FormState, value: string) => void
  onItem: (index: number, patch: Partial<RecebimentoItemForm>) => void
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onSubmit: () => void
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100vw', md: 860 } } } }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <DrawerHeader
          title="Novo recebimento"
          subtitle="Registre a entrada de materiais no estoque."
          onClose={onClose}
        />

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Stack spacing={3}>
            <Section title="Dados do recebimento">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Nome do abrigo" value={form.nome_abrigo} onChange={(e) => onField('nome_abrigo', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Município/UF" value={form.municipio_uf} onChange={(e) => onField('municipio_uf', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Órgão responsável" value={form.orgao_responsavel} onChange={(e) => onField('orgao_responsavel', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField label="Data" type="date" value={form.data_recebimento} onChange={(e) => onField('data_recebimento', e.target.value)} fullWidth required slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TimeInput label="Hora" value={form.hora_recebimento} onChange={(value) => onField('hora_recebimento', value)} required />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Autocomplete
                    freeSolo
                    options={origemOptions}
                    value={form.origem}
                    inputValue={form.origem}
                    onChange={(_, value) => onField('origem', value ?? '')}
                    onInputChange={(_, value) => onField('origem', value)}
                    renderInput={(params) => <TextField {...params} label="Origem dos materiais" required />}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label="Detalhe da origem" value={form.origem_outro} onChange={(e) => onField('origem_outro', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Nome do doador / instituição" value={form.doador_nome} onChange={(e) => onField('doador_nome', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="CPF/CNPJ" value={form.doador_documento} onChange={(e) => onField('doador_documento', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Telefone/contato" value={form.doador_contato} onChange={(e) => onField('doador_contato', e.target.value)} fullWidth />
                </Grid>
              </Grid>
            </Section>

            <Section
              title="Materiais recebidos"
              action={<Button startIcon={<AddIcon />} onClick={onAddItem}>Adicionar item</Button>}
            >
              <Stack spacing={1.5}>
                {itens.map((item, index) => (
                  <Grid key={index} container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Autocomplete
                        options={materiais}
                        getOptionLabel={(option) => `${option.nome} — ${option.categoria}`}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={item.material}
                        onChange={(_, value) => onItem(index, { material: value })}
                        renderInput={(params) => <TextField {...params} label="Material do catálogo" required />}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, md: 1.5 }}>
                      <TextField label="Qtd." type="number" value={item.quantidade} onChange={(e) => onItem(index, { quantidade: Number(e.target.value) })} fullWidth slotProps={{ htmlInput: { min: 1 } }} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 1.5 }}>
                      <TextField label="Unidade" value={item.material?.unidade ?? ''} fullWidth disabled placeholder="—" />
                    </Grid>
                    <Grid size={{ xs: 8, md: 2 }}>
                      <TextField select label="Condição" value={item.condicao} onChange={(e) => onItem(index, { condicao: e.target.value as 'novo' | 'usado' })} fullWidth>
                        <MenuItem value="novo">Novo</MenuItem>
                        <MenuItem value="usado">Usado</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.5 }}>
                      <TextField label="Observações" value={item.observacoes} onChange={(e) => onItem(index, { observacoes: e.target.value })} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 4, md: 0.5 }}>
                      <IconButton aria-label="Remover item" onClick={() => onRemoveItem(index)} disabled={itens.length === 1}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Section>

            <Section title="Conferência e destino">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField select label="Conferido?" value={form.conferido} onChange={(e) => onField('conferido', e.target.value)} fullWidth>
                    <MenuItem value="sim">Sim</MenuItem>
                    <MenuItem value="nao">Não</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label="Motivo" value={form.motivo_nao_conferido} onChange={(e) => onField('motivo_nao_conferido', e.target.value)} fullWidth disabled={form.conferido === 'sim'} required={form.conferido === 'nao'} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField select label="Restrição ou validade próxima?" value={form.possui_restricao} onChange={(e) => onField('possui_restricao', e.target.value)} fullWidth>
                    <MenuItem value="nao">Não</MenuItem>
                    <MenuItem value="sim">Sim</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label="Descrever restrição" value={form.restricao_descricao} onChange={(e) => onField('restricao_descricao', e.target.value)} fullWidth disabled={form.possui_restricao === 'nao'} required={form.possui_restricao === 'sim'} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField select label="Destinação inicial" value={form.destinacao_inicial} onChange={(e) => onField('destinacao_inicial', e.target.value)} fullWidth>
                    <MenuItem value="estoque">Armazenamento em estoque</MenuItem>
                    <MenuItem value="distribuicao_imediata">Distribuição imediata</MenuItem>
                    <MenuItem value="setor_especifico">Encaminhado para setor específico</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField label="Local de armazenamento/setor" value={form.local_armazenamento} onChange={(e) => onField('local_armazenamento', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Recebido por" value={form.recebido_por} onChange={(e) => onField('recebido_por', e.target.value)} fullWidth required />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Função/equipe" value={form.funcao_equipe} onChange={(e) => onField('funcao_equipe', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Entregue por" value={form.entregue_por} onChange={(e) => onField('entregue_por', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField label="Observações gerais" value={form.observacoes_gerais} onChange={(e) => onField('observacoes_gerais', e.target.value)} multiline minRows={3} fullWidth />
                </Grid>
              </Grid>
            </Section>
          </Stack>
        </Box>

        <DrawerFooter>
          <Button color="inherit" onClick={onClose}>Cancelar</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Salvando...' : 'Salvar recebimento'}
          </Button>
        </DrawerFooter>
      </Box>
    </Drawer>
  )
}

function DistribuicaoDrawer({
  open,
  materiais,
  acolhidos,
  familias,
  destinoTipo,
  selectedAcolhido,
  selectedFamilia,
  form,
  carrinho,
  readyCount,
  cartTotal,
  loading,
  recebimentos,
  onClose,
  onDestino,
  onAcolhido,
  onFamilia,
  onField,
  onCartItem,
  onAddCartItem,
  onRemoveCartItem,
}: {
  open: boolean
  materiais: Material[]
  acolhidos: Acolhido[]
  familias: Familia[]
  destinoTipo: EntregaDestinoTipo
  selectedAcolhido: Acolhido | null
  selectedFamilia: Familia | null
  form: DistribuicaoForm
  carrinho: CartItem[]
  readyCount: number
  cartTotal: number
  loading: boolean
  distributing: boolean
  recebimentos: Recebimento[]
  onClose: () => void
  onDestino: (_: unknown, value: EntregaDestinoTipo | null) => void
  onAcolhido: (value: Acolhido | null) => void
  onFamilia: (value: Familia | null) => void
  onField: (field: keyof DistribuicaoForm, value: string) => void
  onCartItem: (index: number, patch: Partial<CartItem>) => void
  onAddCartItem: () => void
  onRemoveCartItem: (index: number) => void
  onSubmit: () => void
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100vw', md: 820 } } } }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <DrawerHeader
          title="Nova distribuição"
          subtitle="Entregue materiais para pessoas, famílias ou destinos externos."
          onClose={onClose}
        />

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Stack spacing={3}>
            <Section title="Destino">
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                  <ToggleButtonGroup exclusive value={destinoTipo} onChange={onDestino} size="small" color="primary">
                    <ToggleButton value="acolhido">Pessoa</ToggleButton>
                    <ToggleButton value="familia">Família</ToggleButton>
                    <ToggleButton value="externo">Externo</ToggleButton>
                  </ToggleButtonGroup>
                  <TextField
                    label="Data da entrega"
                    type="date"
                    value={form.data_entrega}
                    onChange={(e) => onField('data_entrega', e.target.value)}
                    required
                    sx={{ width: { xs: '100%', md: 220 } }}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Stack>

                {destinoTipo === 'acolhido' ? (
                  <Autocomplete
                    options={acolhidos}
                    getOptionLabel={(option) => `${option.name} | ${option.cpf || 'CPF não informado'}${option.familyCode ? ` | ${option.familyCode}` : ''}`}
                    value={selectedAcolhido}
                    onChange={(_, value) => onAcolhido(value)}
                    loading={loading}
                    renderInput={(params) => <TextField {...params} label="Pessoa acolhida ativa" required />}
                  />
                ) : null}

                {destinoTipo === 'familia' ? (
                  <Autocomplete
                    options={familias}
                    getOptionLabel={(option) => `${option.codigo} | ${option.responsavelNome ?? 'Responsável não informado'} | ${option.acolhidosCount} membro(s)`}
                    value={selectedFamilia}
                    onChange={(_, value) => onFamilia(value)}
                    loading={loading}
                    renderInput={(params) => <TextField {...params} label="Família ativa" required />}
                  />
                ) : null}

                {destinoTipo === 'externo' ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField label="Destinatário externo" value={form.externo_nome} onChange={(e) => onField('externo_nome', e.target.value)} fullWidth required />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField label="Instituição" value={form.externo_instituicao} onChange={(e) => onField('externo_instituicao', e.target.value)} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField label="Documento" value={form.externo_documento} onChange={(e) => onField('externo_documento', e.target.value)} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField label="Contato" value={form.externo_contato} onChange={(e) => onField('externo_contato', e.target.value)} fullWidth />
                    </Grid>
                  </Grid>
                ) : null}
              </Stack>
            </Section>

            <Section
              title="Carrinho de materiais"
              action={<Button startIcon={<AddShoppingCartIcon />} onClick={onAddCartItem}>Adicionar material</Button>}
            >
              <Stack spacing={1.5}>
                {carrinho.map((item, index) => (
                  <Grid key={index} container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Autocomplete
                        options={materiais}
                        getOptionLabel={(option) => `${option.nome} | ${option.categoria} | ${option.estoque_atual} ${option.unidade}`}
                        value={item.material}
                        onChange={(_, value) => onCartItem(index, { material: value, quantidade: value ? Math.min(item.quantidade || 1, Math.max(value.estoque_atual, 1)) : 1 })}
                        renderInput={(params) => <TextField {...params} label="Material" required />}
                      />
                    </Grid>
                    <Grid size={{ xs: 8, md: 2 }}>
                      <TextField
                        label="Quantidade"
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => onCartItem(index, { quantidade: Number(e.target.value) })}
                        fullWidth
                        slotProps={{ htmlInput: { min: 1, max: item.material?.estoque_atual ?? undefined } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 4, md: 1 }}>
                      <IconButton aria-label="Remover material" onClick={() => onRemoveCartItem(index)}>
                        <RemoveCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Typography variant="body2" color={item.material && item.quantidade > item.material.estoque_atual ? 'error.main' : 'text.secondary'}>
                        Saldo: {item.material ? `${item.material.estoque_atual} ${item.material.unidade}` : 'Selecione'}
                      </Typography>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Section>

            <Section title="Finalização">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField label="Finalidade" value={form.finalidade} onChange={(e) => onField('finalidade', e.target.value)} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField label="Observações" value={form.observacoes} onChange={(e) => onField('observacoes', e.target.value)} fullWidth />
                </Grid>
              </Grid>

              <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography variant="subtitle2">Resumo da distribuição</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {destinationSummary(destinoTipo, selectedAcolhido, selectedFamilia, form)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {readyCount} material(is), {cartTotal} unidade(s)
                  </Typography>
                </Stack>
              </Paper>
            </Section>
          </Stack>
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
      </Box>
    </Drawer>
  )
}

function DrawerHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
      </Box>
      <IconButton onClick={onClose} aria-label="Fechar">
        <CloseIcon />
      </IconButton>
    </Box>
  )
}

function DrawerFooter({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
      {children}
    </Box>
  )
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}
        >
          {title}
        </Typography>
        {action}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Box>
  )
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">{text}</Typography>
      </TableCell>
    </TableRow>
  )
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b))
}

function isReadyCartItem(item: CartItem): item is ReadyCartItem {
  return !!item.material && item.quantidade > 0
}

function isReadyRecebimentoItem(item: RecebimentoItemForm): item is RecebimentoItemForm & { material: Material } {
  return !!item.material && item.quantidade > 0
}

function findOverStockItem(items: ReadyCartItem[]): ReadyCartItem | null {
  const totals = new Map<number, ReadyCartItem>()

  items.forEach((item) => {
    const current = totals.get(item.material.id)
    totals.set(item.material.id, {
      material: item.material,
      quantidade: (current?.quantidade ?? 0) + item.quantidade,
    })
  })

  return Array.from(totals.values()).find((item) => item.quantidade > item.material.estoque_atual) ?? null
}

function groupEntregas(entregas: Entrega[]): EntregaGrupo[] {
  const groups = new Map<string, EntregaGrupo>()

  entregas.forEach((entrega) => {
    const key = entrega.grupo_entrega ?? `entrega-${entrega.id}`
    const current = groups.get(key)

    if (current) {
      current.itens.push(entrega)
      current.totalItens += entrega.quantidade
      return
    }

    groups.set(key, {
      id: key,
      data: entrega.data_entrega,
      destinoTipo: entrega.destino_tipo,
      destino: entregaDestinationLabel(entrega),
      finalidade: entrega.finalidade,
      observacoes: entrega.observacoes,
      entreguePor: entrega.entregue_por?.name ?? 'Não informado',
      itens: [entrega],
      totalItens: entrega.quantidade,
    })
  })

  return Array.from(groups.values()).sort((a, b) => {
    const dateCompare = b.data.localeCompare(a.data)
    return dateCompare !== 0 ? dateCompare : b.id.localeCompare(a.id)
  })
}

function entregaDestinationLabel(entrega: Entrega): string {
  if (entrega.destino_tipo === 'acolhido' && entrega.acolhido) {
    return `${entrega.acolhido.nome} | ${entrega.acolhido.codigo_pulseira ?? entrega.acolhido.id}`
  }

  if (entrega.destino_tipo === 'familia' && entrega.familia) {
    return `${entrega.familia.codigo} | ${entrega.familia.responsavel_nome ?? 'Responsável não informado'}`
  }

  if (entrega.destino_tipo === 'externo') {
    return [entrega.externo_nome, entrega.externo_instituicao].filter(Boolean).join(' | ') || 'Destinatário externo'
  }

  return 'Não informado'
}

function destinoTipoLabel(tipo: EntregaDestinoTipo | null): string {
  if (tipo === 'acolhido') return 'Pessoa'
  if (tipo === 'familia') return 'Família'
  if (tipo === 'externo') return 'Externo'
  return 'Não informado'
}

function destinationSummary(
  tipo: EntregaDestinoTipo,
  acolhido: Acolhido | null,
  familia: Familia | null,
  form: DistribuicaoForm,
): string {
  if (tipo === 'acolhido') return acolhido ? `${acolhido.name} | ${acolhido.id}` : 'Pessoa acolhida não selecionada'
  if (tipo === 'familia') return familia ? `${familia.codigo} | ${familia.responsavelNome ?? 'Responsável não informado'}` : 'Família não selecionada'
  return form.externo_nome.trim() || 'Destinatário externo não informado'
}

function formatDate(date?: string | null) {
  if (!date) return 'Não informado'
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}

function valueOrFallback(value?: string | number | null) {
  const normalized = value == null ? '' : String(value).trim()
  return normalized || 'Não informado'
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
  const validationErrors = response?.data?.errors
  const firstValidationMessage = validationErrors ? Object.values(validationErrors)[0]?.[0] : undefined

  return firstValidationMessage ?? response?.data?.message ?? fallback
}
