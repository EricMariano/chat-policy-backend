# Prisma - Guia de Uso

## Configuração Inicial

1. Configure a variável `DATABASE_URL` no arquivo `.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

2. Gere o Prisma Client:
```bash
npm run prisma:generate
```

3. Execute as migrations para criar as tabelas no banco:
```bash
npm run prisma:migrate
```

## Scripts Disponíveis

- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Cria e aplica migrations
- `npm run prisma:studio` - Abre interface visual do banco
- `npm run prisma:push` - Sincroniza schema com banco (dev)

## Model User

O model User possui os seguintes campos:
- `id` - UUID gerado automaticamente
- `name` - Nome do usuário (máx 150 caracteres)
- `email` - Email único (máx 255 caracteres)
- `password` - Senha hash (máx 255 caracteres)
- `typeUserId` - Tipo de usuário (1 ou 2)
- `createdAt` - Data de criação
- `updatedAt` - Data de atualização
