FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем весь проект
COPY . .

# Создаём папку для статики, если её нет
RUN mkdir -p public

EXPOSE 8080

CMD ["node", "server.js"]
