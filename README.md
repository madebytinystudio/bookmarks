# Bookmark Manager

A simple browser-based bookmark manager with Safari HTML import/export. The app stores data locally in your browser using `localStorage`, so no backend is needed for online use.

## Online use

- Import bookmarks from a Safari HTML file.
- Browse and search bookmarks.
- Assign bookmarks to folders.
- Export bookmarks back to HTML.

## Run locally

1. Open the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

The app will run at http://localhost:5173.

## GitHub Pages

This repository is configured for GitHub Pages deployment. The app is served from `/bookmarks/`.

## Note

The app is designed for online use as a static frontend. Local browser storage keeps your bookmarks private.


- Импорт закладок из HTML Safari
- Просмотр списка закладок с поиском и сортировкой
- Удаление закладок
- Экспорт закладок обратно в HTML

## API

- `GET /api/bookmarks` — получить список закладок
- `POST /api/bookmarks/import` — импортировать HTML файл
- `GET /api/bookmarks/export` — экспортировать все закладки в HTML
- `DELETE /api/bookmarks/:id` — удалить закладку
