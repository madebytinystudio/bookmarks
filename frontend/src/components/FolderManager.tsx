import { useState, type DragEvent } from 'react';

interface FolderManagerProps {
  folderPaths: string[];
  folderCounts: Record<string, number>;
  selectedFolder: string | null;
  onSelect: (folder: string | null) => void;
  onAddFolder: (name: string) => void;
  onDeleteFolder: (path: string) => void;
  onDropBookmark: (bookmarkId: number, folder: string | null) => void;
  total: number;
}

export default function FolderManager({ folderPaths, folderCounts, selectedFolder, onSelect, onAddFolder, onDeleteFolder, onDropBookmark, total }: FolderManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddFolder(newName.trim());
    setNewName('');
    setAdding(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, folder: string | null) => {
    event.preventDefault();
    const rawBookmarkId = event.dataTransfer.getData('text/bookmark-id');
    const bookmarkId = Number(rawBookmarkId);
    setDropTarget(null);

    if (Number.isNaN(bookmarkId)) {
      return;
    }

    onDropBookmark(bookmarkId, folder);
  };

  return (
    <nav className="folder-nav">
      <div
        className={`folder-item${selectedFolder === null ? ' active' : ''}${dropTarget === '__root__' ? ' drop-target' : ''}`}
        onClick={() => onSelect(null)}
        onDragOver={(event) => {
          event.preventDefault();
          setDropTarget('__root__');
        }}
        onDragLeave={() => setDropTarget((current) => (current === '__root__' ? null : current))}
        onDrop={(event) => handleDrop(event, null)}
      >
        <span className="folder-icon">📚</span>
        <span className="folder-name">All Bookmarks</span>
        <span className="folder-count">{total}</span>
      </div>

      {folderPaths.map((path) => (
        <div
          key={path}
          className={`folder-item${selectedFolder === path ? ' active' : ''}${dropTarget === path ? ' drop-target' : ''}`}
          onClick={() => onSelect(path)}
          onDragOver={(event) => {
            event.preventDefault();
            setDropTarget(path);
          }}
          onDragLeave={() => setDropTarget((current) => (current === path ? null : current))}
          onDrop={(event) => handleDrop(event, path)}
        >
          <span className="folder-icon">📁</span>
          <span className="folder-name">{path}</span>
          {folderCounts[path] != null && (
            <span className="folder-count">{folderCounts[path]}</span>
          )}
          <button
            className="folder-delete-btn"
            title="Delete folder"
            onClick={(e) => { e.stopPropagation(); onDeleteFolder(path); }}
          >
            ✕
          </button>
        </div>
      ))}

      {adding ? (
        <div className="folder-add-row">
          <input
            autoFocus
            className="folder-add-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setAdding(false); setNewName(''); }
            }}
            placeholder="Folder name..."
          />
        </div>
      ) : (
        <button className="folder-add-btn" onClick={() => setAdding(true)}>
          + New folder
        </button>
      )}
    </nav>
  );
}
