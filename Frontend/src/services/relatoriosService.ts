import { api } from './api';

// ── Filtros ───────────────────────────────────────────────────────────────────

export interface RelatorioFiltros {
  de: string;
  ate: string;
  setorId?: number | null;
}

function periodoParams(filtros: RelatorioFiltros) {
  return {
    de: filtros.de,
    ate: filtros.ate,
    setor_id: filtros.setorId || undefined,
  };
}

// ── Acolhimentos ──────────────────────────────────────────────────────────────

export interface RelatorioAcolhimentos {
  periodo: { de: string; ate: string };
  totais: { entradas: number; saidas: number };
  serie: Array<{ dia: string; entradas: number; saidas: number }>;
  motivosSaida: Array<{ motivo: string; total: number }>;
  condicoesSaida: Array<{ condicao: string; total: number }>;
  permanencia: {
    mediaDias: number;
    medianaDias: number;
    minimoDias: number;
    maximoDias: number;
  } | null;
  encaminhamentos: Array<{ encaminhamento: string; total: number }>;
}

interface ApiRelatorioAcolhimentos {
  periodo: { de: string; ate: string };
  totais: { entradas: number; saidas: number };
  serie: Array<{ dia: string; entradas: number; saidas: number }>;
  motivos_saida: Array<{ motivo: string; total: number }>;
  condicoes_saida: Array<{ condicao: string; total: number }>;
  permanencia: {
    media_dias: number;
    mediana_dias: number;
    minimo_dias: number;
    maximo_dias: number;
  } | null;
  encaminhamentos: Array<{ encaminhamento: string; total: number }>;
}

export async function fetchRelatorioAcolhimentos(
  filtros: RelatorioFiltros,
): Promise<RelatorioAcolhimentos> {
  const res = await api.get<{ data: ApiRelatorioAcolhimentos }>(
    '/relatorios/acolhimentos',
    { params: periodoParams(filtros) },
  );
  const data = res.data.data;

  return {
    periodo: data.periodo,
    totais: data.totais,
    serie: data.serie,
    motivosSaida: data.motivos_saida,
    condicoesSaida: data.condicoes_saida,
    permanencia: data.permanencia
      ? {
          mediaDias: data.permanencia.media_dias,
          medianaDias: data.permanencia.mediana_dias,
          minimoDias: data.permanencia.minimo_dias,
          maximoDias: data.permanencia.maximo_dias,
        }
      : null,
    encaminhamentos: data.encaminhamentos,
  };
}

// ── Ocupação ──────────────────────────────────────────────────────────────────

export interface RelatorioOcupacaoSetor {
  setorId: number;
  nome: string;
  cor: string;
  capacidade: number;
  leitosInterditados: number;
  ocupados: number;
  livres: number;
  taxa: number | null;
}

export interface RelatorioOcupacao {
  periodo: { de: string; ate: string };
  atual: RelatorioOcupacaoSetor[];
  capacidadeDisponivel: number;
  historico: Array<{ dia: string; ocupados: number; taxa: number | null }>;
  agregacao: 'dia' | 'semana';
}

interface ApiRelatorioOcupacao {
  periodo: { de: string; ate: string };
  atual: Array<{
    setor_id: number;
    nome: string;
    cor: string;
    capacidade: number;
    leitos_interditados: number;
    ocupados: number;
    livres: number;
    taxa: number | null;
  }>;
  capacidade_disponivel: number;
  historico: Array<{ dia: string; ocupados: number; taxa: number | null }>;
  agregacao: 'dia' | 'semana';
}

export async function fetchRelatorioOcupacao(
  filtros: RelatorioFiltros,
): Promise<RelatorioOcupacao> {
  const res = await api.get<{ data: ApiRelatorioOcupacao }>(
    '/relatorios/ocupacao',
    { params: periodoParams(filtros) },
  );
  const data = res.data.data;

  return {
    periodo: data.periodo,
    atual: data.atual.map((setor) => ({
      setorId: setor.setor_id,
      nome: setor.nome,
      cor: setor.cor,
      capacidade: setor.capacidade,
      leitosInterditados: setor.leitos_interditados,
      ocupados: setor.ocupados,
      livres: setor.livres,
      taxa: setor.taxa,
    })),
    capacidadeDisponivel: data.capacidade_disponivel,
    historico: data.historico,
    agregacao: data.agregacao,
  };
}

// ── Estoque ───────────────────────────────────────────────────────────────────

export interface RelatorioEstoque {
  periodo: { de: string; ate: string };
  totais: { itensRecebidos: number; itensEntregues: number };
  serie: Array<{ dia: string; recebidos: number; entregues: number }>;
  recebidosPorMaterial: Array<{
    materialId: number | null;
    nome: string;
    total: number;
  }>;
  recebimentosPorOrigem: Array<{
    origem: string;
    recebimentos: number;
    itens: number;
  }>;
  entregasPorDestino: Array<{
    destino: string;
    registros: number;
    itens: number;
  }>;
  entregasPorMaterial: Array<{
    materialId: number;
    nome: string;
    registros: number;
    total: number;
  }>;
  saldoAtual: Array<{
    id: number;
    nome: string;
    categoria: string | null;
    unidade: string;
    estoqueAtual: number;
  }>;
}

interface ApiRelatorioEstoque {
  periodo: { de: string; ate: string };
  totais: { itens_recebidos: number; itens_entregues: number };
  serie: Array<{ dia: string; recebidos: number; entregues: number }>;
  recebidos_por_material: Array<{
    material_id: number | null;
    nome: string;
    total: number;
  }>;
  recebimentos_por_origem: Array<{
    origem: string;
    recebimentos: number;
    itens: number;
  }>;
  entregas_por_destino: Array<{
    destino: string;
    registros: number;
    itens: number;
  }>;
  entregas_por_material: Array<{
    material_id: number;
    nome: string;
    registros: number;
    total: number;
  }>;
  saldo_atual: Array<{
    id: number;
    nome: string;
    categoria: string | null;
    unidade: string;
    estoque_atual: number;
  }>;
}

export async function fetchRelatorioEstoque(
  filtros: RelatorioFiltros,
): Promise<RelatorioEstoque> {
  const res = await api.get<{ data: ApiRelatorioEstoque }>(
    '/relatorios/estoque',
    { params: { de: filtros.de, ate: filtros.ate } },
  );
  const data = res.data.data;

  return {
    periodo: data.periodo,
    totais: {
      itensRecebidos: data.totais.itens_recebidos,
      itensEntregues: data.totais.itens_entregues,
    },
    serie: data.serie,
    recebidosPorMaterial: data.recebidos_por_material.map((item) => ({
      materialId: item.material_id,
      nome: item.nome,
      total: item.total,
    })),
    recebimentosPorOrigem: data.recebimentos_por_origem,
    entregasPorDestino: data.entregas_por_destino,
    entregasPorMaterial: data.entregas_por_material.map((item) => ({
      materialId: item.material_id,
      nome: item.nome,
      registros: item.registros,
      total: item.total,
    })),
    saldoAtual: data.saldo_atual.map((item) => ({
      id: item.id,
      nome: item.nome,
      categoria: item.categoria,
      unidade: item.unidade,
      estoqueAtual: item.estoque_atual,
    })),
  };
}

// ── Perfil ────────────────────────────────────────────────────────────────────

export interface RelatorioPerfil {
  dataReferencia: string;
  total: number;
  faixasEtarias: Array<{ faixa: string; total: number }>;
  genero: Array<{ genero: string; total: number }>;
  saude: { pcd: number; gestante: number; cronica: number; idoso: number };
  porSetor: Array<{ setorId: number; nome: string; total: number }>;
}

interface ApiRelatorioPerfil {
  data_referencia: string;
  total: number;
  faixas_etarias: Array<{ faixa: string; total: number }>;
  genero: Array<{ genero: string; total: number }>;
  saude: { pcd: number; gestante: number; cronica: number; idoso: number };
  por_setor: Array<{ setor_id: number; nome: string; total: number }>;
}

export async function fetchRelatorioPerfil(filtros: {
  dataReferencia?: string;
  setorId?: number | null;
}): Promise<RelatorioPerfil> {
  const res = await api.get<{ data: ApiRelatorioPerfil }>('/relatorios/perfil', {
    params: {
      data_referencia: filtros.dataReferencia || undefined,
      setor_id: filtros.setorId || undefined,
    },
  });
  const data = res.data.data;

  return {
    dataReferencia: data.data_referencia,
    total: data.total,
    faixasEtarias: data.faixas_etarias,
    genero: data.genero,
    saude: data.saude,
    porSetor: data.por_setor.map((setor) => ({
      setorId: setor.setor_id,
      nome: setor.nome,
      total: setor.total,
    })),
  };
}
