import { z } from 'zod';

const numberArrayFromQuery = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const values = Array.isArray(value) ? value : String(value).split(',');

  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
}, z.array(z.number()).optional());

export const createPermissionGroupSchema = z.object({
  permissionGroupNm: z
    .string('Nome do grupo de permissão é um campo obrigatório')
    .min(3, 'Nome do grupo de permissão não pode ter menos de 3 caracteres')
    .max(100, 'Nome do grupo de permissão não pode ter mais de 100 caracteres'),
});

export const updatePermissionGroupSchema = z.object({
  permissionGroupId: z.number(
    'ID do grupo de permissão é um campo obrigatório',
  ),
  permissionGroupNm: z
    .string('Nome do grupo de permissão é um campo obrigatório')
    .min(3, 'Nome do grupo de permissão não pode ter menos de 3 caracteres')
    .max(100, 'Nome do grupo de permissão não pode ter mais de 100 caracteres'),
});

export const defaultPermissionGroupSchema = z.object({
  permissionGroupId: z.coerce.number(
    'ID do grupo de permissão é um campo obrigatório',
  ),
});

export const permissionGroupUserSchema = z.object({
  permissionGroupId: z.coerce.number(
    'ID do grupo de permissão é um campo obrigatório',
  ),
  userId: z.coerce.number('ID do usuário é um campo obrigatório'),
});

export const permissionGroupUsersSchema = z.object({
  userIds: z
    .array(z.coerce.number('ID do usuário é um campo obrigatório'))
    .min(1, 'Informe pelo menos um usuário'),
});

export const permissionGroupDepartmentSchema = z.object({
  permissionGroupId: z.coerce.number(
    'ID do grupo de permissão é um campo obrigatório',
  ),
  departmentId: z.coerce.number('ID do departamento é um campo obrigatório'),
});

export const permissionGroupSystemSchema = z.object({
  permissionGroupId: z.coerce.number(
    'ID do grupo de permissão é um campo obrigatório',
  ),
  systemId: z.coerce.number('ID do sistema é um campo obrigatório'),
});

export const filterPermissionGroupsSchema = z.object({
  permissionGroupNm: z.string().optional().nullable(),
  departmentsIds: z.array(z.coerce.number()).optional(),
  systemsIds: z.array(z.coerce.number()).optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  currentPage: z.coerce.number().min(1, 'currentPage invalida').default(1),
});

export const scrollingPermissionGroupUsersSchema = z.object({
  userId: z.coerce.number().optional(),
  name: z.string().optional().nullable(),
});

export const filterPermissionGroupAccessSchema = z.object({
  name: z.string().optional().nullable(),
});
