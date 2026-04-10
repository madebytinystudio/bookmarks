import { Bookmark, Folder } from './types';

const BOOKMARKS_KEY = 'bookmarks_data_v1';
const FOLDERS_KEY = 'folders_data_v1';

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadLocalBookmarks(): Bookmark[] {
  return safeParse<Bookmark[]>(localStorage.getItem(BOOKMARKS_KEY), []);
}

export function saveLocalBookmarks(bookmarks: Bookmark[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export function loadLocalFolders(): Folder[] {
  return safeParse<Folder[]>(localStorage.getItem(FOLDERS_KEY), []);
}

export function saveLocalFolders(folders: Folder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function getNextBookmarkId(bookmarks: Bookmark[]) {
  return bookmarks.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function getNextFolderId(folders: Folder[]) {
  return folders.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function ensureFoldersFromPaths(paths: Array<string | null | undefined>): Folder[] {
  const folders = loadLocalFolders();
  const existing = [...folders];
  const now = new Date().toISOString();

  const findFolder = (name: string, parent: string | null) =>
    existing.find((folder) => folder.name === name && folder.parent === parent);

  const buildPath = (path: string) => {
    const parts = path.split(' / ').map((part) => part.trim()).filter(Boolean);
    let parent: string | null = null;

    for (const part of parts) {
      let folder = findFolder(part, parent);
      if (!folder) {
        folder = {
          id: getNextFolderId(existing),
          name: part,
          parent,
          createdAt: now,
          updatedAt: now,
        };
        existing.push(folder);
      }
      parent = folder.name;
    }
  };

  paths.forEach((path) => {
    if (path) buildPath(path);
  });

  saveLocalFolders(existing);
  return existing;
}

export function getFolderPaths(): string[] {
  const folders = loadLocalFolders();
  const folderByNameAndParent = (name: string, parent: string | null) =>
    folders.find((folder) => folder.name === name && folder.parent === parent);

  function resolvePath(folder: Folder): string {
    if (!folder.parent) return folder.name;
    const parent = folderByNameAndParent(folder.parent, null) ||
      folders.find((item) => item.name === folder.parent);
    return parent ? `${resolvePath(parent)} / ${folder.name}` : folder.name;
  }

  const paths = folders.map((folder) => resolvePath(folder));
  return Array.from(new Set(paths)).sort();
}

export function parseSafariBookmarksHtml(html: string): Array<Omit<Bookmark, 'id' | 'createdAt'>> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const result: Array<Omit<Bookmark, 'id' | 'createdAt'>> = [];

  function normalizeFolderPath(parts: string[]) {
    const trimmed = parts.map((part) => part.trim()).filter(Boolean);
    return trimmed.length ? trimmed.join(' / ') : null;
  }

  function getDirectChildByTag(element: Element, tagName: string): Element | null {
    return Array.from(element.children).find((child) => child.tagName.toUpperCase() === tagName) ?? null;
  }

  function getNextListElement(element: Element): Element | null {
    let next = element.nextElementSibling;

    while (next) {
      if (next.tagName.toUpperCase() === 'DL') {
        return next;
      }

      const nestedList = getDirectChildByTag(next, 'DL');
      if (nestedList) {
        return nestedList;
      }

      next = next.nextElementSibling;
    }

    return null;
  }

  function traverse(element: Element, folderStack: string[]) {
    const children = Array.from(element.children);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const tagName = child.tagName.toUpperCase();

      if (tagName === 'P' || tagName === 'DL') {
        traverse(child, folderStack);
        continue;
      }

      if (tagName === 'DT') {
        const h3 = getDirectChildByTag(child, 'H3');
        const a = getDirectChildByTag(child, 'A');

        if (h3) {
          const folderName = h3.textContent?.trim() ?? ''; 
          const nextList = getDirectChildByTag(child, 'DL') ?? getNextListElement(child);
          if (nextList && folderName) {
            traverse(nextList, [...folderStack, folderName]);
          }
        }

        if (a) {
          const title = a.textContent?.trim() || a.getAttribute('title') || a.getAttribute('href') || 'Bookmark';
          const url = a.getAttribute('href') || '';
          result.push({
            title,
            url,
            folder: normalizeFolderPath(folderStack),
            order: 0,
          });
        }
      }
    }
  }

  const rootDl = doc.querySelector('dl');
  if (rootDl) {
    traverse(rootDl, []);
  }

  return result;
}

export function generateSafariBookmarksHtml(bookmarks: Bookmark[]): string {
  function escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  type FolderNode = {
    name: string;
    children: Map<string, FolderNode>;
    items: Bookmark[];
  };

  const root: FolderNode = { name: 'Bookmarks', children: new Map(), items: [] };

  for (const bookmark of bookmarks) {
    const folderKey = bookmark.folder || '';
    if (!folderKey) {
      root.items.push(bookmark);
      continue;
    }

    const parts = folderKey.split(' / ').map((part) => part.trim()).filter(Boolean);
    let node = root;
    for (const part of parts) {
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, children: new Map(), items: [] });
      }
      node = node.children.get(part)!;
    }
    node.items.push(bookmark);
  }

  function renderNode(node: FolderNode, isRoot = false): string {
    let html = '';
    if (!isRoot) {
      html += `  <DT><H3>${escapeHtml(node.name)}</H3>\n  <DL><p>\n`;
    }

    for (const item of node.items) {
      const title = escapeHtml(item.title);
      const url = escapeHtml(item.url);
      html += `    <DT><A HREF="${url}">${title}</A>\n`;
    }

    for (const child of node.children.values()) {
      html += renderNode(child, false);
    }

    if (!isRoot) {
      html += '  </DL><p>\n';
    }

    return html;
  }

  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<!-- This is an automatically generated file. -->\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${renderNode(root, true)}</DL><p>\n`;
}

export function downloadBookmarksHtml(bookmarks: Bookmark[]) {
  const html = generateSafariBookmarksHtml(bookmarks);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bookmarks.html';
  link.click();
  window.URL.revokeObjectURL(url);
}

export function importBookmarksFromFile(file: File): Promise<Array<Omit<Bookmark, 'id' | 'createdAt'>>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result;
      if (typeof content !== 'string') {
        reject(new Error('Unable to read file content'));
        return;
      }
      const items = parseSafariBookmarksHtml(content);
      resolve(items);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file, 'utf-8');
  });
}

export function updateBookmarkInStorage(id: number, changes: Partial<Pick<Bookmark, 'title' | 'url' | 'folder' | 'order'>>): Bookmark[] {
  const bookmarks = loadLocalBookmarks();
  const updated = bookmarks.map((bookmark) => (bookmark.id === id ? { ...bookmark, ...changes } : bookmark));
  saveLocalBookmarks(updated);
  return updated;
}

export function deleteBookmarkFromStorage(id: number): Bookmark[] {
  const bookmarks = loadLocalBookmarks();
  const updated = bookmarks.filter((bookmark) => bookmark.id !== id);
  saveLocalBookmarks(updated);
  return updated;
}

export function addBookmarksToStorage(newBookmarks: Omit<Bookmark, 'id' | 'createdAt'>[]): Bookmark[] {
  const existing = loadLocalBookmarks();
  const nextId = getNextBookmarkId(existing);
  const enriched = newBookmarks.map((item, index) => ({
    ...item,
    id: nextId + index,
    createdAt: new Date().toISOString(),
    order: existing.length + index,
  }));

  const result = [...existing, ...enriched];
  saveLocalBookmarks(result);
  return result;
}

export function reorderBookmarksInStorage(bookmarks: Bookmark[]): Bookmark[] {
  const updated = bookmarks.map((bookmark, index) => ({ ...bookmark, order: index }));
  saveLocalBookmarks(updated);
  return updated;
}

export function addFolderToStorage(name: string, parent?: string | null): Folder[] {
  const folders = loadLocalFolders();
  const now = new Date().toISOString();
  const nextId = getNextFolderId(folders);
  const folder: Folder = {
    id: nextId,
    name,
    parent: parent || null,
    createdAt: now,
    updatedAt: now,
  };
  const result = [...folders, folder];
  saveLocalFolders(result);
  return result;
}

export function updateFolderInStorage(id: number, name: string): Folder[] {
  const folders = loadLocalFolders();
  const updated = folders.map((folder) => ({
    ...folder,
    name: folder.id === id ? name : folder.name,
    parent: folder.parent === folders.find((f) => f.id === id)?.name ? name : folder.parent,
    updatedAt: folder.id === id ? new Date().toISOString() : folder.updatedAt,
  }));
  saveLocalFolders(updated);
  return updated;
}

export function deleteFolderFromStorage(id: number): Folder[] {
  const folders = loadLocalFolders();
  const folderToDelete = folders.find((folder) => folder.id === id);
  const remaining = folders.filter((folder) => folder.id !== id).map((folder) => ({
    ...folder,
    parent: folder.parent === folderToDelete?.name ? null : folder.parent,
  }));
  saveLocalFolders(remaining);
  return remaining;
}
