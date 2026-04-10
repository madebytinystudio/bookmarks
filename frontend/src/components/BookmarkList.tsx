import { Bookmark } from '../types';
import BookmarkItem from './BookmarkItem';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  folderPaths: string[];
  onDelete: (id: number) => void;
  onSave: (id: number, changes: Partial<Pick<Bookmark, 'title' | 'url' | 'folder'>>) => Promise<void>;
  onFolderClick: (folder: string | null | undefined) => void;
}

export default function BookmarkList({ bookmarks, folderPaths, onDelete, onSave, onFolderClick }: BookmarkListProps) {
  if (!bookmarks.length) {
    return (
      <div className="empty-state">
        <p>No bookmarks yet. Paste a URL above or import an HTML file.</p>
      </div>
    );
  }

  return (
    <ul className="bookmark-list">
      {bookmarks.map((b) => (
        <li key={b.id}>
          <BookmarkItem
            bookmark={b}
            folderPaths={folderPaths}
            onDelete={onDelete}
            onSave={onSave}
            onFolderClick={onFolderClick}
          />
        </li>
      ))}
    </ul>
  );
}
