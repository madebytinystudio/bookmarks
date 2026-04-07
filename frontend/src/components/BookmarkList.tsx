import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bookmark } from '../types';
import BookmarkItem from './BookmarkItem';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  folderPaths: string[];
  onDelete: (id: number) => void;
  onSave: (id: number, changes: Partial<Pick<Bookmark, 'title' | 'url' | 'folder'>>) => Promise<void>;
  onUpdate: () => void;
  onReorder: (bookmarks: Bookmark[]) => void;
  viewMode: 'grid' | 'list';
  onFolderClick: (folder: string | null | undefined) => void;
}

function SortableBookmarkItem({ bookmark, onDelete, onSave, onUpdate, viewMode, onFolderClick, folderPaths }: { bookmark: Bookmark; onDelete: (id: number) => void; onSave: (id: number, changes: Partial<Pick<Bookmark, 'title' | 'url' | 'folder'>>) => Promise<void>; onUpdate: () => void; viewMode: 'grid' | 'list'; onFolderClick: (folder: string | null | undefined) => void; folderPaths: string[] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return viewMode === 'list' ? (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookmarkItem bookmark={bookmark} onDelete={onDelete} onSave={onSave} onUpdate={onUpdate} viewMode={viewMode} folderPaths={folderPaths} onFolderClick={onFolderClick} />
    </li>
  ) : (
    <div style={{ ...style, minHeight: 'auto' }} ref={setNodeRef} >
      <BookmarkItem bookmark={bookmark} onDelete={onDelete} onSave={onSave} onUpdate={onUpdate} viewMode={viewMode} folderPaths={folderPaths} listeners={listeners} attributes={attributes} onFolderClick={onFolderClick} />
    </div>
  );
}

export default function BookmarkList({ bookmarks, folderPaths, onDelete, onSave, onUpdate, onReorder, viewMode, onFolderClick }: BookmarkListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = bookmarks.findIndex((item) => item.id === active.id);
      const newIndex = bookmarks.findIndex((item) => item.id === over.id);

      const newBookmarks = arrayMove(bookmarks, oldIndex, newIndex);
      onReorder(newBookmarks);
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="box has-text-centered has-text-grey">
        <div className="is-size-1 mb-4">📚</div>
        <h3 className="title is-4 mb-2">No bookmarks yet</h3>
        <p>Upload an HTML file or add a new bookmark via API.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={bookmarks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        {viewMode === 'list' ? (
          <ul className="">
            {bookmarks.map((bookmark) => (
              <SortableBookmarkItem key={bookmark.id} bookmark={bookmark} folderPaths={folderPaths} onDelete={onDelete} onSave={onSave} onUpdate={onUpdate} viewMode={viewMode} onFolderClick={onFolderClick} />
            ))}
          </ul>
        ) : (
          <div className="pinterest-grid">
            {bookmarks.map((bookmark) => (
              <SortableBookmarkItem key={bookmark.id} bookmark={bookmark} folderPaths={folderPaths} onDelete={onDelete} onSave={onSave} onUpdate={onUpdate} viewMode={viewMode} onFolderClick={onFolderClick} />
            ))}
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}
