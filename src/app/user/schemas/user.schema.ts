import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string("Nome do usuario é um campo obrigatório")
  .min(3,"Nome do usuario não pode ter menos de 3 caracteres")
  .max(150, "Nome do usuario não pode ter mais de 150 caracteres"),
  email: z.string("Email é um campo obrigatório")
  .email("Email invalido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
  .max(32,"Senha muito longa"),
  typeUserId: z.number("Tipo de usuario é um campo obrigatório")
  .min(1,"Tipo de usuario invalido")
  .max(2,"Tipo de usuario invalido"),
  permissionGroupIds: z.array(z.coerce.number().positive("Grupo de permissão invalido")).optional()
});

export const updateUserSchema = z.object({
  userId: z.number("ID do usuario é um campo obrigatório").optional(),
  name: z.string("Nome do usuario é um campo obrigatório")
  .min(3,"Nome do usuario não pode ter menos de 3 caracteres")
  .max(150, "Nome do usuario não pode ter mais de 150 caracteres"),
  email: z.string("Email é um campo obrigatório")
  .email("Email invalido"),
  typeUserId: z.number("Tipo de usuario é um campo obrigatório")
  .min(1,"Tipo de usuario invalido")
  .max(2,"Tipo de usuario invalido"),
  active: z.boolean().optional()
});

export const loginUserSchema = z.object({
  email: z.string("Email é um campo obrigatório")
  .email("Email invalido"),
  password: z.string("Senha é um campo obrigatório")
  .min(6, "Senha deve ter no mínimo 6 caracteres")
  .max(32,"Senha muito longa"),
});