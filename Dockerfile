FROM node:20-alpine

WORKDIR /app

# Instala só as dependências de produção (aproveita cache do Docker)
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
# O Cloud Run injeta a variável PORT (8080) — o server.js já usa process.env.PORT
EXPOSE 8080

CMD ["node", "server.js"]
