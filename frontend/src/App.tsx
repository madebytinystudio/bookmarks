import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Folder } from './types';
import BookmarkList from './components/BookmarkList';
import FolderManager from './components/FolderManager';
import {
  addBookmarksToStorage,
  addFolderToStorage,
  deleteBookmarkFromStorage,
  deleteFolderFromStorage,
  downloadBookmarksHtml,
  ensureFoldersFromPaths,
  getFolderPaths,
  getNextBookmarkId,
  importBookmarksFromFile,
  loadLocalBookmarks,
  loadLocalFolders,
  saveLocalBookmarks,
  saveLocalFolders,
  updateBookmarkInStorage,
} from './storage';

type Toast = {
  id: number;
  message: string;
  undo?: () => void;
  expiresAt?: number;
};

const TOAST_DURATION_MS = 5000;

const sortOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'title-asc', label: 'Name A-Z' },
  { value: 'title-desc', label: 'Name Z-A' },
  { value: 'url-asc', label: 'Link A-Z' },
  { value: 'url-desc', label: 'Link Z-A' },
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
];

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folderPaths, setFolderPaths] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('manual');
  const [addUrl, setAddUrl] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [toastCountdown, setToastCountdown] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e: MediaQueryList | MediaQueryListEvent) => {
      setIsDark(e.matches);
      document.documentElement.style.colorScheme = e.matches ? 'dark' : 'light';
    };
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;

    const updateCountdown = () => {
      if (!toast.expiresAt) {
        setToastCountdown(0);
        return;
      }

      const remainingMs = Math.max(0, toast.expiresAt - Date.now());
      setToastCountdown(Math.ceil(remainingMs / 1000));
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 200);
    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, Math.max(0, (toast.expiresAt ?? Date.now()) - Date.now()));

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  const reload = () => {
    const data = loadLocalBookmarks();
    setBookmarks(data);
    ensureFoldersFromPaths(data.map((b) => b.folder));
    setFolderPaths(getFolderPaths());
  };

  const showToast = (message: string, undo?: () => void) => {
    setToast({
      id: Date.now(),
      message,
      undo,
      expiresAt: undo ? Date.now() + TOAST_DURATION_MS : undefined,
    });
  };

  const restoreSnapshot = (snapshot: {
    bookmarks: Bookmark[];
    folders: Folder[];
    selectedFolder: string | null;
  }) => {
    saveLocalBookmarks(snapshot.bookmarks);
    saveLocalFolders(snapshot.folders);
    setSelectedFolder(snapshot.selectedFolder);
    reload();
  };

  const runUndoable = async (message: string, mutate: () => void | Promise<void>) => {
    const snapshot = {
      bookmarks: loadLocalBookmarks(),
      folders: loadLocalFolders(),
      selectedFolder,
    };

    await mutate();

    showToast(message, () => {
      restoreSnapshot(snapshot);
      showToast(`Undid: ${message.toLowerCase()}`);
    });
  };

  useEffect(() => { reload(); }, []);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookmarks.forEach((b) => {
      if (b.folder) counts[b.folder] = (counts[b.folder] ?? 0) + 1;
    });
    return counts;
  }, [bookmarks]);

  const filtered = useMemo(() => {
    return [...bookmarks]
      .filter((b) => {
        const matchFolder = selectedFolder === null || b.folder === selectedFolder;
        const q = search.trim().toLowerCase();
        const matchSearch = !q ||
          [b.title, b.url, b.folder ?? ''].some((v) => v?.toLowerCase().includes(q));
        return matchFolder && matchSearch;
      })
      .sort((a, b) => {
        switch (sort) {
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'url-asc':
            return a.url.localeCompare(b.url);
          case 'url-desc':
            return b.url.localeCompare(a.url);
          case 'date-desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'date-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          default:
            return a.order - b.order;
        }
      });
  }, [bookmarks, selectedFolder, search, sort]);

  const handleAdd = () => {
    const raw = addUrl.trim();
    if (!raw) return;
    const url = raw.startsWith('http') ? raw : `https://${raw}`;

    void runUndoable('Bookmark added', async () => {
      const existing = loadLocalBookmarks();
      const newBookmark: Bookmark = {
        id: getNextBookmarkId(existing),
        title: url,
        url,
        folder: selectedFolder ?? null,
        order: existing.length,
        createdAt: new Date().toISOString(),
      };

      saveLocalBookmarks([...existing, newBookmark]);
      setAddUrl('');
      reload();
    });
  };

  const handleDelete = (id: number) => {
    void runUndoable('Bookmark deleted', async () => {
      deleteBookmarkFromStorage(id);
      reload();
    });
  };

  const handleSave = async (id: number, changes: Partial<Pick<Bookmark, 'title' | 'url' | 'folder'>>) => {
    await runUndoable('Bookmark updated', async () => {
      updateBookmarkInStorage(id, changes);
      if (changes.folder !== undefined) {
        ensureFoldersFromPaths([changes.folder]);
      }
      reload();
    });
  };

  const handleImport = async (file: File) => {
    const toAdd = await importBookmarksFromFile(file);
    if (!toAdd.length) {
      showToast('No bookmarks found in file');
      return;
    }

    await runUndoable(`Imported ${toAdd.length} bookmarks`, async () => {
      ensureFoldersFromPaths(toAdd.map((b) => b.folder));
      addBookmarksToStorage(toAdd);
      reload();
    });
  };

  const handleAddFolder = (name: string) => {
    void runUndoable('Folder added', async () => {
      addFolderToStorage(name.trim(), null);
      reload();
    });
  };

  const handleDeleteFolder = (path: string) => {
    const folders = loadLocalFolders();
    const bookmarksSnapshot = loadLocalBookmarks();
    const segments = path.split(' / ');
    const name = segments[segments.length - 1].trim();
    const parent = segments.length > 1 ? segments[segments.length - 2].trim() : null;
    const folder = folders.find((item) => item.name === name && item.parent === parent);
    if (!folder) return;

    void runUndoable('Folder deleted', async () => {
      const updatedBookmarks = bookmarksSnapshot.map((bookmark) => {
        const currentFolder = bookmark.folder ?? null;
        if (!currentFolder) {
          return bookmark;
        }

        if (currentFolder === path) {
          return { ...bookmark, folder: null };
        }

        if (currentFolder.startsWith(`${path} / `)) {
          return {
            ...bookmark,
            folder: currentFolder.slice(path.length + 3) || null,
          };
        }

        return bookmark;
      });

      saveLocalBookmarks(updatedBookmarks);
      deleteFolderFromStorage(folder.id);
      if (selectedFolder === path) {
        setSelectedFolder(null);
      }
      reload();
    });
  };

  const handleDropBookmarkToFolder = (bookmarkId: number, folder: string | null) => {
    const bookmark = bookmarks.find((item) => item.id === bookmarkId);
    if (!bookmark || (bookmark.folder ?? null) === folder) {
      return;
    }

    void runUndoable(folder ? `Moved bookmark to ${folder}` : 'Moved bookmark to root', async () => {
      updateBookmarkInStorage(bookmarkId, { folder });
      if (folder) {
        ensureFoldersFromPaths([folder]);
      }
      reload();
    });
  };

  const handleClearAll = () => {
    if (!bookmarks.length) {
      showToast('No bookmarks to clear');
      return;
    }

    void runUndoable('Cleared all bookmarks', async () => {
      saveLocalBookmarks([]);
      saveLocalFolders([]);
      setSelectedFolder(null);
      reload();
    });
  };

  return (
    <div className="app-shell" data-theme={isDark ? 'dark' : 'light'}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="app-title">Bookmarks</span>
        </div>
        <FolderManager
          folderPaths={folderPaths}
          folderCounts={folderCounts}
          selectedFolder={selectedFolder}
          onSelect={setSelectedFolder}
          onAddFolder={handleAddFolder}
          onDeleteFolder={handleDeleteFolder}
          onDropBookmark={handleDropBookmarkToFolder}
          total={bookmarks.length}
        />
        <div className="sidebar-footer">
          <label className="action-btn">
            Import HTML
            <input
              type="file"
              accept="text/html"
              className="hidden-input"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) { await handleImport(f); e.target.value = ''; }
              }}
            />
          </label>
          <button className="action-btn" onClick={() => downloadBookmarksHtml(bookmarks)}>
            Export
          </button>
          <button className="action-btn action-btn-danger" onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="add-row">
          <input
            className="add-input"
            type="text"
            placeholder="Paste a URL and press Enter to add..."
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button className="add-btn" onClick={handleAdd}>Add</button>
        </div>

        <BookmarkList
          bookmarks={filtered}
          folderPaths={folderPaths}
          onDelete={handleDelete}
          onSave={handleSave}
          onFolderClick={(f) => setSelectedFolder(f ?? null)}
        />
      </main>

      {toast && (
        <div className="toast-layer">
          <div className="toast">
            <span className="toast-message">{toast.message}</span>
            {toast.undo && (
              <button
                className="toast-action"
                onClick={() => {
                  const undo = toast.undo;
                  setToast(null);
                  undo();
                }}
              >
                Undo{toastCountdown > 0 ? ` (${toastCountdown})` : ''}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
