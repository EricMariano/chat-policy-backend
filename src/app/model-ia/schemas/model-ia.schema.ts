import { z } from 'zod';

export const createModelIaSchema = z.object({
  modelNm: z
    .string()
    .min(2, 'Nome do modelo não pode ter menos de 2 caracteres')
    .max(100, 'Nome do modelo não pode ter mais de 100 caracteres'),
});

export const updateModelIaSchema = z.object({
  modelIaId: z.number({ message: 'ID do modelo é um campo obrigatório' }),
  modelNm: z
    .string()
    .min(2, 'Nome do modelo não pode ter menos de 2 caracteres')
    .max(100, 'Nome do modelo não pode ter mais de 100 caracteres')
    .optional(),
  active: z.boolean().optional(),
});

export const defaultModelIaSchema = z.object({
  modelIaId: z.coerce.number({ message: 'ID do modelo é um campo obrigatório' }),
});
