import { api } from './api';

export interface Material {
  id: number;
  nome: string;
  unidade: string;
  categoria: string;
  estoque_atual: number;
  ativo?: boolean;
}

export interface RecebimentoItem {
  categoria: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  condicao: 'novo' | 'usado';
  observacoes: string;
}

// Itens enviados no recebimento: o material e escolhido do catalogo (sem digitar livre),
// entao so o id, a quantidade e a condicao sao informados.
export interface RecebimentoItemPayload {
  material_id: number;
  quantidade: number;
  condicao: 'novo' | 'usado';
  observacoes: string;
}

export interface Recebimento {
  id: number;
  data_recebimento: string;
  hora_recebimento: string;
  origem: string;
  doador_nome: string;
  recebido_por: string;
  itens: RecebimentoItem[];
}

export interface RecebimentoPayload {
  nome_abrigo: string;
  municipio_uf: string;
  orgao_responsavel: string;
  data_recebimento: string;
  hora_recebimento: string;
  origem: string;
  origem_outro: string;
  doador_nome: string;
  doador_documento: string;
  doador_contato: string;
  conferido: boolean;
  motivo_nao_conferido: string;
  possui_restricao: boolean;
  restricao_descricao: string;
  destinacao_inicial: string;
  local_armazenamento: string;
  recebido_por: string;
  funcao_equipe: string;
  entregue_por: string;
  observacoes_gerais: string;
  itens: RecebimentoItemPayload[];
}

export type EntregaDestinoTipo = 'acolhido' | 'familia' | 'externo';

export interface Entrega {
  id: number;
  grupo_entrega: string | null;
  material: Material | null;
  familia: {
    id: number;
    codigo: string;
    responsavel_nome: string | null;
  } | null;
  acolhido: {
    id: number;
    codigo_pulseira: string | null;
    nome: string;
  } | null;
  destino_tipo: EntregaDestinoTipo | null;
  externo_nome: string | null;
  externo_documento: string | null;
  externo_contato: string | null;
  externo_instituicao: string | null;
  quantidade: number;
  data_entrega: string;
  finalidade: string | null;
  observacoes: string | null;
  entregue_por: {
    id: number;
    name: string;
  } | null;
}

export interface EntregaLotePayload {
  data_entrega: string;
  destino_tipo: EntregaDestinoTipo;
  familia_id?: number | null;
  acolhido_id?: number | null;
  externo_nome?: string | null;
  externo_documento?: string | null;
  externo_contato?: string | null;
  externo_instituicao?: string | null;
  finalidade?: string | null;
  observacoes?: string | null;
  itens: Array<{
    material_id: number;
    quantidade: number;
  }>;
}

export async function fetchMateriais(): Promise<Material[]> {
  const res = await api.get<{ data: Material[] }>('/materiais');
  return res.data.data;
}

export async function fetchRecebimentos(): Promise<Recebimento[]> {
  const res = await api.get<{ data: Recebimento[] }>('/recebimentos-materiais');
  return res.data.data;
}

export async function fetchEntregas(): Promise<Entrega[]> {
  const res = await api.get<{ data: Entrega[] }>('/entregas');
  return res.data.data;
}

export async function createRecebimento(
  payload: RecebimentoPayload,
): Promise<Recebimento> {
  const res = await api.post<{ data: Recebimento }>(
    '/recebimentos-materiais',
    payload,
  );
  return res.data.data;
}

export async function createEntregaLote(
  payload: EntregaLotePayload,
): Promise<Entrega[]> {
  const res = await api.post<{ data: Entrega[] }>('/entregas/lote', payload);
  return res.data.data;
}
