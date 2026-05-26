import { z } from "zod";

export const createSystemSchema = z.object({
  systemNm: z.string("Nome do sistema é um campo obrigatório")
  .min(3,"Nome do sistema não pode ter menos de 3 caracteres")
  .max(100, "Nome do sistema não pode ter mais de 100 caracteres"),
  acronym: z.string("Sigla é um campo obrigatório")
  .min(2,"Sigla não pode ter menos de 2 caracteres")
  .max(5,"Sigla não pode ter mais de 5 caracteres")
});

export const updateSystemSchema = z.object({
  systemId: z.number("ID do sistema é um campo obrigatório"),
  systemNm: z.string("Nome do sistema é um campo obrigatório")
  .min(3,"Nome do sistema não pode ter menos de 3 caracteres")
  .max(100, "Nome do sistema não pode ter mais de 100 caracteres"),
  acronym: z.string("Sigla é um campo obrigatório")
  .min(2,"Sigla não pode ter menos de 2 caracteres")
  .max(5,"Sigla não pode ter mais de 5 caracteres")
});

export const defaultSystemSchema = z.object({
  systemId: z.coerce.number("ID do sistema é um campo obrigatório"),
});

export const scrollingSystemSchema = z.object({
   systemId: z.coerce.number().optional()
})