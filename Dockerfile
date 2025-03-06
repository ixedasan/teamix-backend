FROM node:20.17.0-alpine AS base

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS build

COPY . .

RUN pnpm prisma generate

RUN pnpm build

FROM base AS production

WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma/generated ./prisma/generated

CMD ["node", "dist/main"]