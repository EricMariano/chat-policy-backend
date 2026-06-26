# Estágio 1: Build
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

# Opcional: Garantir que a pasta existe antes do build (caso não esteja no Git)
# RUN mkdir -p documents

RUN npm run prisma:generate
RUN npm run build

# --- Estágio 2: Produção ---
FROM node:20-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copia os ficheiros necessários do estágio de build
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/prisma.config.ts ./

USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npx -y tsx prisma/seed.ts && node dist/src/main.js"]