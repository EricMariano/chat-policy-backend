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
