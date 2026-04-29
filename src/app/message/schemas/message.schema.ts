import { z } from "zod";

export const createMessageSchema = z.object({
  messageText: z.string("Texto da mensagem é um campo obrigatório")
  .min(1, "Texto da mensagem não pode estar vazio")
  .max(2000, "Texto da mensagem não pode ter mais de 2000 caracteres"),
  chatId: z.string("ID do chat é um campo obrigatório")
  .uuid("ID do chat deve ser um UUID válido").optional(),
  modelIaId:z.number("ID do modelo de IA é um campo obrigatório").positive("Modelo de IA invalido"),
});

export const defaultMessageSchema = z.object({
  messageId: z.string("ID da mensagem é um campo obrigatório")
  .uuid("ID da mensagem deve ser um UUID válido"),
});

export const findMessagesWithPaginationSchema = z.object({
  chatId: z.string("ID do chat é um campo obrigatório")
  .uuid("ID do chat deve ser um UUID válido"),
  lastMessageId: z.string("ID da última mensagem é um campo obrigatório")
  .uuid("ID da última mensagem deve ser um UUID válido").optional(),
  lastSendAt: z.string("Data de envio da última mensagem é um campo obrigatório")
  .datetime("Data de envio da última mensagem deve ser uma data válida").optional(),
});