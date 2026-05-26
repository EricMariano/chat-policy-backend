import { z } from "zod";

export const createChatSchema = z.object({
  title: z.string().min(3).max(100)
});

export const updateChatSchema = z.object({
  chatId: z.string().uuid("ID do chat deve ser um UUID válido"),
  title: z.string().min(3).max(100)
});

export const defaultChatSchema = z.object({
  chatId: z.string().uuid("ID do chat deve ser um UUID válido"),
});

export const scrollingChatSchema = z.object({
  chatId: z.string().uuid("ID do chat deve ser um UUID válido").optional()
});

export const sharechatSchema = z.object({
  chatId: z.string({ message: 'ID do chat é obrigatório' }).uuid('ID do chat deve ser um UUID válido'),
  targetUserId: z.number({ message: 'ID do usuário é obrigatório' }),
  roleChatId: z.number({ message: 'ID do role é obrigatório' }),
});

export const updateSharedChatSchema = z.object({
  chatId: z.string({ message: 'ID do chat é obrigatório' }).uuid('ID do chat deve ser um UUID válido'),
  targetUserId: z.number({ message: 'ID do usuário é obrigatório' }),
  roleChatId: z.number({ message: 'ID do role é obrigatório' }),
});

export const removeSharedChatSchema = z.object({
  chatId: z.string({ message: 'ID do chat é obrigatório' }).uuid('ID do chat deve ser um UUID válido'),
  targetUserId: z.coerce.number({ message: 'ID do usuário é obrigatório' }),
});
