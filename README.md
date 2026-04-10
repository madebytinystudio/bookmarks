# Bookmark Manager

A lightweight bookmark manager with Safari/Netscape HTML import and export. The app stores data locally in your browser with `localStorage`, so you can use it as a static frontend without sending bookmark data to a server.

## Features

- Import bookmarks from Safari or other Netscape-style bookmark HTML files.
- Browse, search, sort, and edit bookmarks.
- Organize bookmarks into folders.
- Drag bookmarks onto folders to move them.
- Export bookmarks back to HTML.
- Undo recent actions with a countdown toast.

## Local Development

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the frontend development server:
   ```bash
   npm run dev
   ```

The frontend runs at `http://localhost:5173`.

## Backend

The main bookmark manager works as a static frontend and stores its data in browser storage. A backend is included in this repository for server-side experiments and API-based workflows.

To run the backend locally:

```bash
cd backend
npm install
npm run dev
```

The backend runs at `http://localhost:4000`.

## GitHub Pages

This repository is configured for GitHub Pages deployment. The published app is served from `/bookmarks/`.

The GitHub Actions workflow:

- installs frontend dependencies with `npm ci`
- builds the production bundle with `npm run build`
- deploys `frontend/dist` to the `gh-pages` branch

## Build

To test the production build locally:

```bash
cd frontend
npm run build
```

## API

If you use the backend, these routes are available:

- `GET /api/bookmarks` — list bookmarks
- `POST /api/bookmarks/import` — import a bookmark HTML file
- `GET /api/bookmarks/export` — export all bookmarks to HTML
- `DELETE /api/bookmarks/:id` — delete a bookmark

## Privacy

When you use the frontend directly, bookmarks stay in your browser storage unless you explicitly export them.
