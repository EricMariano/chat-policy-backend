import { z } from 'zod';

export const createModelIaKeySchema = z.object({
  modelIaId: z.number({ message: 'ID do modelo é um campo obrigatório' }),
  qtnToken: z
    .number({ message: 'Quantidade de tokens é um campo obrigatório' })
    .positive('Quantidade de tokens deve ser positiva'),
});

export const updateModelIaKeySchema = z.object({
  modelIaId: z.number({ message: 'ID do modelo é um campo obrigatório' }),
  modelKey: z.string().uuid('Chave do modelo inválida'),
  qtnToken: z.number().positive('Quantidade de tokens deve ser positiva').optional(),
  active: z.boolean().optional(),
});

export const defaultModelIaKeySchema = z.object({
  modelIaId: z.coerce.number({ message: 'ID do modelo é um campo obrigatório' }),
  modelKey: z.string().uuid('Chave do modelo inválida'),
});
