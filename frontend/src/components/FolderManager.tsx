import { useState, useEffect } from 'react';
import { Folder01Icon, Add01Icon, Delete02Icon, PencilIcon } from 'hugeicons-react';
import { Folder } from '../types';
import { addFolderToStorage, deleteFolderFromStorage, loadLocalFolders, updateFolderInStorage } from '../storage';

interface FolderManagerProps {
  onFolderSelect?: (folderPath: string) => void;
  selectedFolder?: string;
  onFoldersChange?: () => void;
}

export default function FolderManager({ onFolderSelect, selectedFolder, onFoldersChange }: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set(['ROOT']));
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = () => {
    try {
      setLoading(true);
      const data = loadLocalFolders();
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    try {
      const updated = addFolderToStorage(newFolderName, newFolderParent || undefined);
      setFolders(updated);
      setNewFolderName('');
      setNewFolderParent(null);
      onFoldersChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleDeleteFolder = (id: number) => {
    if (!confirm('Are you sure you want to delete this folder?')) return;

    try {
      const updated = deleteFolderFromStorage(id);
      setFolders(updated);
      onFoldersChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
    }
  };

  const handleRenameFolder = (id: number) => {
    if (!editingName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    try {
      const updated = updateFolderInStorage(id, editingName);
      setFolders(updated);
      setEditingId(null);
      setEditingName('');
      onFoldersChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename folder');
    }
  };

  const toggleExpanded = (parent: string | null) => {
    const key = parent || 'ROOT';
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedParents(newExpanded);
  };

  const getFoldersByParent = (parent: string | null) => {
    return folders.filter(f => (f.parent ?? null) === parent).sort((a, b) => a.name.localeCompare(b.name));
  };

  const renderFolderTree = (parent: string | null = null, depth: number = 0) => {
    const children = getFoldersByParent(parent);
    const parentKey = parent ?? 'ROOT';
    const isExpanded = expandedParents.has(parentKey);

    return (
      <div key={`tree-${parent}`} style={{ marginLeft: `${depth * 1.5}rem` }}>
        {children.map(folder => {
          const hasSubfolders = getFoldersByParent(folder.id.toString()).length > 0;
          const folderPath = folder.parent ? `${folder.parent} / ${folder.name}` : folder.name;
          const isSelected = selectedFolder === folderPath;

          return (
            <div key={folder.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? 'var(--bulma-link)' : 'transparent',
                  color: isSelected ? 'white' : 'inherit',
                  marginBottom: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                {hasSubfolders && (
                  <button
                    onClick={() => toggleExpanded(folderPath)}
                    className="button is-small is-ghost"
                    style={{ minWidth: '2rem' }}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                )}
                {!hasSubfolders && <div style={{ minWidth: '2rem' }} />}

                <Folder01Icon size={18} />

                {editingId === folder.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameFolder(folder.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="input is-small"
                    style={{ flex: 1 }}
                  />
                ) : (
                  <span
                    onClick={() => {
                      onFolderSelect?.(folderPath);
                    }}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    {folder.name}
                  </span>
                )}

                {editingId === folder.id ? (
                  <div className="buttons are-small" style={{ gap: '0.25rem' }}>
                    <button
                      onClick={() => handleRenameFolder(folder.id)}
                      className="button is-small is-success"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="button is-small is-danger"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="buttons are-small" style={{ gap: '0.25rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(folder.id);
                        setEditingName(folder.name);
                      }}
                      className="button is-small is-ghost"
                      title="Rename"
                    >
                      <Delete02Icon size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      className="button is-small is-ghost"
                      title="Delete"
                    >
                      <Delete02Icon size={14} />
                    </button>
                  </div>
                )}
              </div>

              {hasSubfolders && isExpanded && renderFolderTree(folderPath, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="box" style={{ boxShadow: 'none', border: '1px solid var(--bulma-border-light)' }}>
      <h2 className="title is-5 mb-4">Folders</h2>

      {error && (
        <div className="notification is-danger is-light mb-4" style={{ fontSize: '0.875rem' }}>
          <button className="delete" onClick={() => setError('')}></button>
          {error}
        </div>
      )}

      {/* Folder tree */}
      <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.5rem' }}>
        {loading ? (
          <p className="has-text-grey">Loading folders...</p>
        ) : folders.length === 0 ? (
          <p className="has-text-grey">No folders yet</p>
        ) : (
          renderFolderTree()
        )}
      </div>

      {/* Create new folder */}
      <div className="field">
        <label className="label is-small">New Folder</label>
        <div className="control" style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
            }}
            placeholder="Folder name"
            className="input is-small"
            style={{ flex: 1 }}
          />
          <button
            onClick={handleCreateFolder}
            className="button is-small is-primary"
            disabled={loading}
          >
            <Add01Icon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
