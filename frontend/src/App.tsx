import { useEffect, useMemo, useState } from 'react';
import { Bookmark } from './types';
import BookmarkList from './components/BookmarkList';
import ImportExport from './components/ImportExport';
import FolderManager from './components/FolderManager';
import { Layout04Icon, ListViewIcon, Search01Icon, FilterIcon } from 'hugeicons-react';
import {
  addBookmarksToStorage,
  deleteBookmarkFromStorage,
  downloadBookmarksHtml,
  ensureFoldersFromPaths,
  getFolderPaths,
  importBookmarksFromFile,
  loadLocalBookmarks,
  reorderBookmarksInStorage,
  updateBookmarkInStorage,
} from './storage';

const sortOptions = [
  { value: 'order', label: 'Default' },
  { value: 'title', label: 'Title' },
  { value: 'createdAt', label: 'Created At' },
];

function App() {
  console.log('App rendering');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('order');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDark, setIsDark] = useState(false);
  const [folderPaths, setFolderPaths] = useState<string[]>([]);
  
  const handleFolderClick = (folder: string | null | undefined) => {
    if (folder) setSearch(folder);
  };

  // Detect system theme preference and listen for changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDark(e.matches);
      document.documentElement.classList.toggle('is-dark', e.matches);
      document.documentElement.style.colorScheme = e.matches ? 'dark' : 'light';
    };
    
    // Set initial state
    handleThemeChange(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  const loadFolderPaths = () => {
    setFolderPaths(getFolderPaths());
  };

  const loadBookmarks = () => {
    const data = loadLocalBookmarks();
    setBookmarks(data);
    ensureFoldersFromPaths(data.map((bookmark) => bookmark.folder));
  };

  useEffect(() => {
    loadBookmarks();
    loadFolderPaths();
  }, []);

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const filteredBookmarks = bookmarks.filter((bookmark) => {
      if (!searchTerm) return true;
      return [bookmark.title, bookmark.url, bookmark.folder ?? '']
        .some((value) => value?.toLowerCase().includes(searchTerm));
    });

    const sortedBookmarks = [...filteredBookmarks];
    if (sort === 'title') {
      sortedBookmarks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'createdAt') {
      sortedBookmarks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sortedBookmarks.sort((a, b) => a.order - b.order);
    }
    return sortedBookmarks;
  }, [bookmarks, search, sort]);

  const handleDelete = (id: number) => {
    try {
      const updated = deleteBookmarkFromStorage(id);
      setBookmarks(updated);
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const handleSave = async (id: number, changes: Partial<Pick<Bookmark, 'title' | 'url' | 'folder'>>) => {
    try {
      const updated = updateBookmarkInStorage(id, changes);
      setBookmarks(updated);
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const bookmarksToAdd = await importBookmarksFromFile(file);
      const folderPathsToAdd = bookmarksToAdd.map((bookmark) => bookmark.folder);
      ensureFoldersFromPaths(folderPathsToAdd);
      loadFolderPaths();
      const updated = addBookmarksToStorage(bookmarksToAdd);
      setBookmarks(updated);
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
    }
  };

  const handleReorder = (newBookmarks: Bookmark[]) => {
    const updated = reorderBookmarksInStorage(newBookmarks);
    setBookmarks(updated);
  };

  const handleExport = () => {
    downloadBookmarksHtml(bookmarks);
  };

  return (
    <div className={`section is-fullheight ${isDark ? 'is-dark has-background-black-bis' : 'has-background-white'} has-text-grey-dark`}>
      <div className="container">
        <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 200px)' }}>
          {/* Sidebar with folders */}
          <div style={{ width: '250px', flexShrink: 0, overflowY: 'auto', paddingRight: '1rem' }}>
            <FolderManager onFolderSelect={handleFolderClick} selectedFolder={search} onFoldersChange={loadFolderPaths} />
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Header row with title and control icons */}
            <div className="mb-4 is-flex is-justify-content-space-between is-align-items-center">
              <div className="is-flex is-align-items-center" style={{ gap: '1rem' }}>
                <a 
                  onClick={() => { setSearch(''); setSort('order'); }} 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none' }} 
                  title="Back to all bookmarks"
                >
                  <h1 className="title is-2 tracking-tight mb-0" style={{ margin: 0, fontWeight: 600 }}>
                    Bookmarks {bookmarks.length > 0 && `(${bookmarks.length})`}
                  </h1>
                </a>
                {/* Grid/List toggle */}
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="button is-rounded is-ghost"
                  title={viewMode === 'grid' ? 'Switch to list' : 'Switch to grid'}
                >
                  {viewMode === 'grid' ? <ListViewIcon size={24} /> : <Layout04Icon size={24} />}
                </button>
                {/* Search icon button */}
                <button
                  onClick={() => {
                    const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
                    searchInput?.focus();
                  }}
                  className="button is-rounded is-ghost"
                  title="Search bookmarks"
                >
                  <Search01Icon size={24} />
                </button>
                {/* Sort icon button */}
                <div className="dropdown" id="sort-dropdown-header">
                  <div className="dropdown-trigger">
                    <button
                      className="button is-rounded is-ghost"
                      title="Sort bookmarks"
                    >
                      <FilterIcon size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <p className="subtitle has-text-grey mb-4">Import your Safari bookmarks, search, sort, and export them back.</p>

            {/* Import/Export section */}
            <div className="mb-6">
              <ImportExport onImport={handleImport} onExport={handleExport} />
            </div>

            {/* Search and Sort controls */}
            <div className="mb-6 is-flex" style={{ gap: '1rem', alignItems: 'flex-start' }}>
              {/* Search input */}
              <div className="field" style={{ flex: 1 }}>
                <div className="control has-icons-left">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search..."
                    className="input"
                  />
                  <span className="icon is-left">
                    <Search01Icon size={18} />
                  </span>
                </div>
              </div>

              {/* Sort dropdown */}
              <div className="field">
                <div className="control">
                  <div className="select">
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Bookmarks section */}
            <section>
              {loading ? (
                <div className="has-text-centered has-text-grey">Loading...</div>
              ) : (
                <BookmarkList bookmarks={filtered} folderPaths={folderPaths} onDelete={handleDelete} onSave={handleSave} onUpdate={loadBookmarks} onReorder={handleReorder} viewMode={viewMode} onFolderClick={handleFolderClick} />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
