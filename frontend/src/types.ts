export interface Bookmark {
  id: number;
  title: string;
  url: string;
  folder?: string | null;
  order: number;
  createdAt: string;
}

export interface Folder {
  id: number;
  name: string;
  parent: string | null;
  createdAt: string;
  updatedAt: string;
}
