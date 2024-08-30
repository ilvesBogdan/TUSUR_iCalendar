# Шаг 1: Установим базовый образ Node.js
FROM node:18 AS build

# Шаг 2: Установим рабочую директорию в контейнере
WORKDIR /app

# Шаг 3: Скопируем package.json и yarn.lock для установки зависимостей
COPY package.json yarn.lock ./

# Шаг 4: Установим зависимости
RUN yarn install

# Шаг 5: Скопируем исходные файлы TypeScript в контейнер
COPY . .

# Шаг 6: Компилируем TypeScript в JavaScript
RUN yarn run tsc

# Шаг 7: Создаем новый чистый образ, где будут только необходимые файлы
FROM node:18 AS production

# Шаг 8: Установим рабочую директорию
WORKDIR /app

# Шаг 9: Скопируем только скомпилированные файлы и зависимости
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/yarn.lock ./
RUN yarn install --production

# Шаг 10: Запускаем приложение
CMD ["node", "dist/index.js"]
