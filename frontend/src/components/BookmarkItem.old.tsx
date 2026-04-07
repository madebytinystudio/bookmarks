import { useState } from 'react';
import { Bookmark } from '../types';
import { updateBookmark } from '../api';
import { ExternalLink, Edit, Save, X, Trash2, GripVertical } from 'lucide-react';

interface BookmarkItemProps {
  bookmark: Bookmark;
  onDelete: (id: number) => void;
  onUpdate: () => void;
  viewMode: 'grid' | 'list';
  listeners?: any;
  attributes?: any;
  onFolderClick?: (folder: string | null | undefined) => void;
}

export default function BookmarkItem({ bookmark, onDelete, onUpdate, viewMode, listeners, attributes, onFolderClick }: BookmarkItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(bookmark.title);

  const handleSave = async () => {
    try {
      if (editTitle.trim() && editTitle !== bookmark.title) {
        await updateBookmark(bookmark.id, { title: editTitle.trim(), url: bookmark.url, folder: bookmark.folder });
        onUpdate();
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update bookmark:', error);
    }
  };

  const handleCancel = () => {
    setEditTitle(bookmark.title);
    setIsEditing(false);
  };

  return viewMode === 'list' ? (
    <div className="box is-flex is-justify-content-space-between is-align-items-center">
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
        <span className="tag" onClick={() => onFolderClick?.(bookmark.folder)} style={{ cursor: 'pointer' }}>{bookmark.folder || 'No folder'}</span>
      </div>
      <div className="buttons">
        <button
          onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
          className="button is-small is-ghost"
          title="Open link"
          data-no-dnd="true"
        >
          <ExternalLink size={20} />
        </button>
        {!isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="button is-small is-ghost"
            title="Edit"
            data-no-dnd="true"
          >
            <Edit size={20} />
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
              <Save size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              className="button is-small is-danger"
              title="Cancel"
              data-no-dnd="true"
            >
              <X size={20} />
            </button>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }}
          className="button is-small is-ghost"
          title="Delete"
          data-no-dnd="true"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  ) : (
    <div className="box">
      <div>
        <div className="level">
          <div className="level-left">
            <div className="is-flex is-align-items-center">
              <span className="icon mr-2" {...listeners} {...attributes}>
                <GripVertical size={16} />
              </span>
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
            </div>
          </div>
          <div className="level-right">
            <div className="buttons">
              <button
                onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank'); }}
                className="button is-small is-ghost"
                title="Open link"
              >
                <ExternalLink size={20} />
              </button>
              {!isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="button is-small is-ghost"
                  title="Edit"
                >
                  <Edit size={20} />
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSave(); }}
                    className="button is-small is-success"
                    title="Save"
                  >
                    <Save size={20} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                    className="button is-small is-danger"
                    title="Cancel"
                  >
                    <X size={20} />
                  </button>
                </>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(bookmark.id); }}
                className="button is-small is-ghost"
                title="Delete"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
        <p className="has-text-grey">{bookmark.url}</p>
      </div>

      <div className="tags">
        <span className="tag" onClick={() => onFolderClick?.(bookmark.folder)} style={{ cursor: 'pointer' }}>{bookmark.folder || 'No folder'}</span>
        <span className="tag">{new Date(bookmark.createdAt).toLocaleString('en-US')}</span>
      </div>
    </div>
  );
}
