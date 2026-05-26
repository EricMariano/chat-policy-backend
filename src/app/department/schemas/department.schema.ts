import { z } from "zod";

export const createDepartmentSchema = z.object({
  departmentNm: z.string("Nome do departamento é um campo obrigatório")
  .min(3,"Nome do departamento não pode ter menos de 3 caracteres")
  .max(100, "Nome do departamento não pode ter mais de 100 caracteres"),
  acronym: z.string("Sigla é um campo obrigatório")
  .min(2,"Sigla não pode ter menos de 2 caracteres")
  .max(5,"Sigla não pode ter mais de 5 caracteres")
});

export const updateDepartmentSchema = z.object({
  departmentId: z.number("ID do departamento é um campo obrigatório"),
  departmentNm: z.string("Nome do departamento é um campo obrigatório")
  .min(3,"Nome do departamento não pode ter menos de 3 caracteres")
  .max(100, "Nome do departamento não pode ter mais de 100 caracteres"),
  acronym: z.string("Sigla é um campo obrigatório")
  .min(2,"Sigla não pode ter menos de 2 caracteres")
  .max(5,"Sigla não pode ter mais de 5 caracteres")
});

export const defaultDepartmentSchema = z.object({
  departmentId: z.coerce.number("ID do departamento é um campo obrigatório"),
});

export const scrollingDepartmentSchema = z.object({
  departmentId: z.coerce.number("ID do departamento é um campo obrigatório").optional()
});