import { useState } from 'react';
import { Bookmark } from '../types';

interface BookmarkItemProps {
  bookmark: Bookmark;
  folderPaths: string[];
  onDelete: (id: number) => void;
  onSave: (id: number, changes: Partial<Pick<Bookmark, 'title' | 'url' | 'folder'>>) => Promise<void>;
  onFolderClick: (folder: string | null | undefined) => void;
}

function getFavicon(url: string) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
  } catch {
    return null;
  }
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function BookmarkItem({ bookmark, folderPaths, onDelete, onSave, onFolderClick }: BookmarkItemProps) {
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [folder, setFolder] = useState(bookmark.folder ?? '');

  const handleSave = async () => {
    await onSave(bookmark.id, { title: title.trim() || url, url, folder: folder || null });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(bookmark.title);
    setUrl(bookmark.url);
    setFolder(bookmark.folder ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bookmark-row editing">
        <input
          className="edit-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') handleCancel(); }}
          placeholder="Title"
          autoFocus
        />
        <input
          className="edit-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL"
        />
        <select className="edit-select" value={folder} onChange={(e) => setFolder(e.target.value)}>
          <option value="">No folder</option>
          {folderPaths.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="edit-actions">
          <button className="save-btn" onClick={handleSave}>Save</button>
          <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  const favicon = getFavicon(bookmark.url);
  const domain = getDomain(bookmark.url);

  return (
    <div
      className={`bookmark-row${dragging ? ' dragging' : ''}`}
      draggable={!editing}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/bookmark-id', String(bookmark.id));
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
    >
      <div className="bookmark-left">
        {favicon && <img src={favicon} className="favicon" alt="" />}
        <div className="bookmark-info">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bookmark-title"
          >
            {bookmark.title || domain}
          </a>
          <span className="bookmark-domain">{domain}</span>
        </div>
      </div>
      <div className="bookmark-right">
        {bookmark.folder && (
          <span
            className="folder-tag"
            title={bookmark.folder}
            onClick={() => onFolderClick(bookmark.folder)}
          >
            {bookmark.folder}
          </span>
        )}
        <button className="row-btn" title="Edit" onClick={() => setEditing(true)}>✏</button>
        <button className="row-btn del-btn" title="Delete" onClick={() => onDelete(bookmark.id)}>✕</button>
      </div>
    </div>
  );
}
