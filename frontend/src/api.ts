import { Bookmark } from './types';

const apiUrl = '/api/bookmarks';
const foldersUrl = '/api/folders';

export interface Folder {
  id: number;
  name: string;
  parent: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchBookmarks(q?: string, sort?: string): Promise<Bookmark[]> {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (sort) params.set('sort', sort);

  const response = await fetch(`${apiUrl}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load bookmarks');
  }

  const data = await response.json();
  // Sort by order if no sort specified
  if (!sort) {
    data.sort((a: Bookmark, b: Bookmark) => a.order - b.order);
  }
  return data;
}

export async function deleteBookmark(id: number): Promise<void> {
  const response = await fetch(`${apiUrl}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete bookmark');
  }
}

export async function updateBookmark(id: number, data: Partial<Pick<Bookmark, 'title' | 'url' | 'folder' | 'order'>>): Promise<Bookmark> {
  const response = await fetch(`${apiUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update bookmark');
  }
  return response.json();
}

export async function importBookmarks(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${apiUrl}/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to import file');
  }
}

export async function exportBookmarks(): Promise<void> {
  const response = await fetch(`${apiUrl}/export`);
  if (!response.ok) {
    throw new Error('Failed to export bookmarks');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bookmarks.html';
  link.click();
  window.URL.revokeObjectURL(url);
}

// Folder API methods
export async function fetchFolders(): Promise<Folder[]> {
  const response = await fetch(foldersUrl);
  if (!response.ok) {
    throw new Error('Failed to load folders');
  }
  return response.json();
}

export async function createFolder(name: string, parent?: string): Promise<Folder> {
  const response = await fetch(foldersUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent: parent || null }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create folder');
  }
  return response.json();
}

export async function deleteFolder(id: number): Promise<void> {
  const response = await fetch(`${foldersUrl}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete folder');
  }
}

export async function renameFolder(id: number, name: string): Promise<Folder> {
  const response = await fetch(`${foldersUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to rename folder');
  }
  return response.json();
}
