# Bookmark Manager

Простое веб-приложение для управления закладками с импортом/экспортом HTML закладок Safari. Данные хранятся локально в браузере (localStorage).

## Структура проекта

- `frontend/` — React + TypeScript + Vite SPA с localStorage для хранения данных
- `backend/` — Node.js + Express API с SQLite через Prisma (для локального запуска, не требуется для онлайн-версии)

## Запуск локально

### Только Frontend (рекомендуется для использования)

1. Перейдите в папку `frontend`:
   ```bash
   cd frontend
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Запустите приложение:
   ```bash
   npm run dev
   ```

Приложение будет доступно на http://localhost:5173

### С Backend (для полной версии с сервером)

1. Перейдите в папку `backend`:
   ```bash
   cd backend
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Сгенерируйте Prisma-клиент и создайте базу данных:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
4. Запустите сервер:
   ```bash
   npm run dev
   ```

5. В отдельном терминале запустите frontend:
   ```bash
   cd ../frontend
   npm run dev
   ```

Backend на http://localhost:3000, frontend на http://localhost:5173

## Развертывание онлайн

Проект можно развернуть как статический сайт (только frontend) на бесплатных платформах:

- **GitHub Pages**: настройте Pages для папки `frontend/dist`
- **Netlify/Vercel**: подключите репозиторий, укажите build команду `npm run build` и папку `dist`
- **Surge/Firebase**: залейте собранную папку `dist`

## Функции

- Импорт закладок из HTML файла Safari
- Экспорт закладок в HTML формат
- Управление папками
- Перетаскивание для сортировки
- Локальное хранение данных в браузере

- Импорт закладок из HTML Safari
- Просмотр списка закладок с поиском и сортировкой
- Удаление закладок
- Экспорт закладок обратно в HTML

## API

- `GET /api/bookmarks` — получить список закладок
- `POST /api/bookmarks/import` — импортировать HTML файл
- `GET /api/bookmarks/export` — экспортировать все закладки в HTML
- `DELETE /api/bookmarks/:id` — удалить закладку
