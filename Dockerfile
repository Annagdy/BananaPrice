FROM node:22-slim

WORKDIR /app

# instala as dependências primeiro (aproveita o cache do Docker)
COPY package*.json ./
RUN npm install

# o código vem do volume (docker-compose.yml), com hot reload
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
