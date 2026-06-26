import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client/default.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const typeUsers = [
    { typeUserId: 1, name: 'Adm', active: true },
    { typeUserId: 2, name: 'Padrão', active: true },
  ];
  for (const typeUser of typeUsers) {
    await prisma.typeUser.upsert({
      where: { typeUserId: typeUser.typeUserId },
      update: { name: typeUser.name, active: typeUser.active },
      create: typeUser,
    });
  }

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence(${'tb_type_user'}, ${'type_user_id'}),
      (SELECT GREATEST(COALESCE(MAX(type_user_id), 1), 1) FROM tb_type_user)
    )
  `;

  await prisma.user.upsert({
    where: { userId: 1 },
    update: {
      email: 'admin@empresa.com',
      name: 'Administrador do Sistema',
      password: '$2b$10$AviD.u1/I.81RepQl6On6.6yEgd4jhhGQJE2CqVgV1FGRZzTPgSo2',
      typeUserId: 1,
      active: true,
    },
    create: {
      userId: 1,
      email: 'admin@empresa.com',
      name: 'Administrador do Sistema',
      password: '$2b$10$AviD.u1/I.81RepQl6On6.6yEgd4jhhGQJE2CqVgV1FGRZzTPgSo2',
      typeUserId: 1,
      active: true,
    },
  });

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence(${'tb_user'}, ${'user_id'}),
      (SELECT GREATEST(COALESCE(MAX(user_id), 1), 1) FROM tb_user)
    )
  `;

  const roleChats = [
    { roleChatId: 1, roleChatNm: 'Leitor', active: true },
    { roleChatId: 2, roleChatNm: 'Editor', active: true },
  ];
  for (const roleChat of roleChats) {
    await prisma.roleChat.upsert({
      where: { roleChatId: roleChat.roleChatId },
      update: { roleChatNm: roleChat.roleChatNm, active: roleChat.active },
      create: roleChat,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
