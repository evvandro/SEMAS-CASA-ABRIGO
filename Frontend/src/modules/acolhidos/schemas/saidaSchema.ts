import { z } from 'zod';

export const saidaSchema = z.object({
  // Identificação do Abrigo
  abrigoNome: z.string().min(1, 'Nome do abrigo é obrigatório'),
  abrigoMunicipio: z.string().min(1, 'Município é obrigatório'),
  abrigoGestor: z.string().min(1, 'Órgão gestor é obrigatório'),

  // Identificação do Acolhido/Família
  prontuario: z.string().optional(),
  registroIndividual: z.string().optional(),
  nome: z.string().min(1, 'Nome completo é obrigatório'),
  cpfRg: z.string().min(1, 'Documento (CPF ou RG) é obrigatório'),
  responsavelFamiliar: z.string().optional(),
  integrantes: z.array(
    z.object({
      nome: z.string(),
      documento: z.string(),
    }),
  ),

  // Registro de Saída
  data: z.string().min(1, 'Data é obrigatória'),
  hora: z.string().min(1, 'Hora é obrigatória'),
  tipoDesligamento: z.string().min(1, 'Tipo de desligamento é obrigatório'),
  tipoDesligamentoOutro: z.string().optional(),

  // Destino
  destinoInformado: z.string().min(1, 'Destino é obrigatório'),
  destinoEndereco: z.string().min(1, 'Endereço é obrigatório'),
  destinoMunicipio: z.string().min(1, 'Município é obrigatório'),
  destinoTelefone: z.string().optional(),

  // Encaminhamentos
  encaminhamentos: z.array(z.string()),
  encaminhamentoOutro: z.string().optional(),
  encaminhamentoResumo: z.string().optional(),

  // Condições na Saída
  condicoesNaSaida: z.string().min(1, 'Condição na saída é obrigatória'),
  condicoesObservacoes: z.string().optional(),

  // Responsável
  responsavelNome: z.string().min(1, 'Nome do responsável é obrigatório'),
  responsavelCargo: z.string().min(1, 'Cargo é obrigatório'),
  responsavelData: z.string().min(1, 'Data é obrigatória'),
});

export type SaidaPayload = z.infer<typeof saidaSchema>;
