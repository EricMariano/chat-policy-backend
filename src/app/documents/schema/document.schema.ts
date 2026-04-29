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

export const schemaCreateDocument = z.object({
  title: z.string()
  .min(5,"Titulo precisa ter no minimo 5 caracteres")
  .max(150,"Titulo nao pode ter mais de 150 caracteres"),
  departmentIds: z.array(z.coerce.number("id do departamento deve ser um número")).optional(),
  systemIds: z.array(z.coerce.number("id do sistema deve ser um número")).optional()
});

export const schemaNewVersionDocument = z.object({
    version: z.string("Versão é obrigatória")
    .max(10,"Versão nao pode ter mais de 10 caracteres"),
    fileId: z.string("ID do arquivo é obrigatório")
});

export const schemaJobDocument = z.object({
    documentVersionId: z.string("ID do documento é obrigatório").uuid("ID do documento invalido")
})