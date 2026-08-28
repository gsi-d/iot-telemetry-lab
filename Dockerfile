FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

# Configuração TypeScript compartilhada pelo monorepo
COPY tsconfig.base.json ./

# Caso exista também um tsconfig.json na raiz:
# COPY tsconfig.json ./

COPY apps ./apps
COPY packages ./packages

RUN npm ci

RUN npm run build

ENV NODE_ENV=production

CMD ["sh", "-c", "npm --workspace apps/$APP_NAME run start"]