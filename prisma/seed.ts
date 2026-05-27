import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client/default.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  await prisma.modelIa.upsert({
    where: { modelIaId: 1 },
    update: {
      modelNm: 'OpenAI',
      active: true,
    },
    create: {
      modelIaId: 1,
      modelNm: 'OpenAI',
      active: true,
    },
  });

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence(${'tb_model_ia'}, ${'model_ia_id'}),
      (SELECT GREATEST(COALESCE(MAX(model_ia_id), 1), 1) FROM tb_model_ia)
    )
  `;
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
