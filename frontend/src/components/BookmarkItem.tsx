import { useState } from 'react';
import { Bookmark } from '../types';
import { Link02Icon, PencilIcon, Download01Icon, Cancel01Icon, Delete02Icon } from 'hugeicons-react';

interface BookmarkItemProps {
  bookmark: Bookmark;
  folderPaths: string[];
  onDelete: (id: number) => void;
  onSave: (id: number, changes: Partial<Pick<Bookmark, 'title' | 'url' | 'folder'>>) => Promise<void>;
  onUpdate: () => void;
  viewMode: 'grid' | 'list';
  listeners?: any;
  attributes?: any;
  onFolderClick?: (folder: string | null | undefined) => void;
}

export default function BookmarkItem({ bookmark, folderPaths, onDelete, onSave, onUpdate, viewMode, listeners, attributes, onFolderClick }: BookmarkItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(bookmark.title);

  const handleSave = async () => {
    try {
      if (editTitle.trim() && editTitle !== bookmark.title) {
        await onSave(bookmark.id, { title: editTitle.trim(), url: bookmark.url, folder: bookmark.folder });
        onUpdate();
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update bookmark:', error);
    }
  };

  const handleFolderChange = async (value: string) => {
    try {
      await onSave(bookmark.id, { folder: value || null });
      onUpdate();
    } catch (error) {
      console.error('Failed to move bookmark:', error);
    }
  };

  const handleCancel = () => {
    setEditTitle(bookmark.title);
    setIsEditing(false);
  };

  return viewMode === 'list' ? (
    <div className="box is-flex is-justify-content-space-between is-align-items-center" style={{ boxShadow: 'none', border: '1px solid var(--bulma-border-light)' }}>
      <div>
        {isEditing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="input"
            autoFocus
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="title is-5 has-text-link"
          >
            {bookmark.title}
          </span>
        )}
        <p className="has-text-grey">{bookmark.url}</p>
        <div style={{ marginTop: '0.75rem' }}>
          <span className="has-text-weight-semibold">Folder:</span>
          <div className="select is-small" style={{ marginTop: '0.25rem' }}>
            <select value={bookmark.folder ?? ''} onChange={(event) => handleFolderChange(event.target.value)}>
              <option value="">No folder</option>
              {folderPaths.map((path) => (
                <option key={path} value={path}>{path}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="buttons">
        <button
          onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
          className="button is-small is-ghost"
          title="Open link"
          data-no-dnd="true"
        >
          <Link02Icon size={20} />
        </button>
        {!isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="button is-small is-ghost"
            title="Edit"
            data-no-dnd="true"
          >
            <PencilIcon size={20} />
          </button>
        )}
        {isEditing && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              className="button is-small is-success"
              title="Save"
              data-no-dnd="true"
            >
              <Download01Icon size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              className="button is-small is-danger"
              title="Cancel"
              data-no-dnd="true"
            >
              <Cancel01Icon size={20} />
            </button>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }}
          className="button is-small is-ghost"
          title="Delete"
          data-no-dnd="true"
        >
          <Delete02Icon size={20} />
        </button>
      </div>
    </div>
  ) : (
    <div className="tile is-child bookmark-card">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Title */}
        <div style={{ marginBottom: '8px' }}>
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="input"
              autoFocus
              style={{ marginBottom: '8px' }}
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              className="title is-5 has-text-link"
              style={{ cursor: 'pointer', wordBreak: 'break-word', margin: '0 0 8px 0' }}
            >
              {bookmark.title}
            </span>
          )}
        </div>

        {/* URL */}
        <p className="has-text-grey" style={{ fontSize: '0.875rem', marginBottom: '8px', wordBreak: 'break-all' }}>
          {bookmark.url}
        </p>

        <div style={{ marginBottom: '12px' }}>
          <span className="has-text-weight-semibold">Folder:</span>
          <div className="select is-small" style={{ marginTop: '0.25rem' }}>
            <select value={bookmark.folder ?? ''} onChange={(event) => handleFolderChange(event.target.value)}>
              <option value="">No folder</option>
              {folderPaths.map((path) => (
                <option key={path} value={path}>{path}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="buttons" style={{ justifyContent: 'flex-end', marginTop: 'auto' }}>
        <button
          onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
          className="button is-small is-ghost"
          title="Open link"
        >
          <Link02Icon size={16} />
        </button>
        {!isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="button is-small is-ghost"
            title="Edit"
          >
            <PencilIcon size={16} />
          </button>
        )}
        {isEditing && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              className="button is-small is-success"
              title="Save"
            >
              <Download01Icon size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              className="button is-small is-danger"
              title="Cancel"
            >
              <Cancel01Icon size={16} />
            </button>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }}
          className="button is-small is-ghost"
          title="Delete"
        >
          <Delete02Icon size={16} />
        </button>
      </div>
    </div>
  );
}
