import z from "zod";

export const pdfSchema = z.object({
  originalname: z.string().min(1, "Nome do arquivo inválido"),
  mimetype: z.string().refine(
    (type) => ["application/pdf","text/plain"].includes(type),
    { message: "Apenas arquivos PDF e TXT são permitidos" }
  ),
  size: z
    .number()
    .max(15 * 1024 * 1024, "Arquivo muito grande (máx 15MB)")
    .min(1, "Arquivo vazio"),
});

const numericIdArray = (message: string) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      return Array.isArray(value) ? value : [value];
    },
    z.array(z.coerce.number(message)),
  ).optional();

export const schemaCreateDocument = z.object({
  title: z.string()
  .min(5,"Titulo precisa ter no minimo 5 caracteres")
  .max(150,"Titulo nao pode ter mais de 150 caracteres"),
  departmentIds: numericIdArray("id do departamento deve ser um número"),
  systemIds: numericIdArray("id do sistema deve ser um número")
});

export const schemaNewVersionDocument = z.object({
    version: z.string("Versão é obrigatória")
    .max(10,"Versão nao pode ter mais de 10 caracteres"),
    fileId: z.string("ID do arquivo é obrigatório")
});

export const schemaJobDocument = z.object({
    documentVersionId: z.string("ID do documento é obrigatório").uuid("ID do documento invalido")
})

export const schemaUpdateDocument = z.object({
  documentVersionId:z.string("id da versão do documento é um campo obrigatório")
  .uuid("id do documento invalido"),
  title:z.string("título do documento é um campo obrigatório")
})

export const schemaToggleDocumentVersionActive = z.object({
  documentVersionId: z.string("id da versão do documento é um campo obrigatório")
  .uuid("id do documento invalido"),
})

export const schemaUpdateDocumentSystems = z.object({
  documentId: z.string({ message: 'ID do documento é obrigatório' }).uuid('ID do documento inválido'),
  systemIds: z.array(z.number({ message: 'ID do sistema deve ser um número' }), { message: 'systemIds deve ser um array' }),
})

export const schemaUpdateDocumentDepartments = z.object({
  documentId: z.string({ message: 'ID do documento é obrigatório' }).uuid('ID do documento inválido'),
  departmentIds: z.array(z.number({ message: 'ID do departamento deve ser um número' }), { message: 'departmentIds deve ser um array' }),
})