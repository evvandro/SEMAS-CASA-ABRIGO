import { z } from 'zod'

export const cadastroSchema = z.object({
  name: z.string().min(3, 'Informe o nome completo'),
  cpf: z.string().refine(value => value.replace(/\D/g, '').length === 11, 'CPF deve ter 11 dígitos'),
  birth: z.string().refine(value => value.replace(/\D/g, '').length === 8, 'Data inválida'),
  family: z.coerce.number().min(1).max(20),
  sectorId: z.string().min(1, 'Selecione um setor'),
  pcd: z.boolean(),
  gestante: z.boolean(),
  cronica: z.boolean(),
  idoso: z.boolean(),
  notes: z.string().optional(),
})
