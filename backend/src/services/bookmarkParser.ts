import { JSDOM } from 'jsdom';
import { Bookmark } from '@prisma/client';

export function parseSafariBookmarks(html: string): Array<Omit<Bookmark, 'id' | 'createdAt'>> {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const links = Array.from(doc.querySelectorAll('a'));

  const results = links.map((link: Element) => {
    return {
      title: link.textContent?.trim() || link.getAttribute('href') || 'Untitled',
      url: link.getAttribute('href') || '',
      folder: buildFolderPath(link),
      order: 0,
    };
  });

  return results.filter((item) => item.url.length > 0);
}

function buildFolderPath(element: Element): string {
  const folders: string[] = [];
  let current: Element | null = element.parentElement;

  while (current) {
    if (current.tagName.toLowerCase() === 'h3') {
      folders.unshift(current.textContent?.trim() || '');
    }
    current = current.parentElement;
  }

  return folders.filter(Boolean).join(' / ');
}

export function generateSafariBookmarksHtml(bookmarks: Bookmark[]): string {
  const lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ];

  // Group bookmarks by folder path
  const folderStructure = buildFolderStructure(bookmarks);

  // Recursively build HTML for folders
  const buildFolderHtml = (folders: Record<string, any>, depth: number = 0) => {
    const indent = '  '.repeat(depth);
    
    for (const [folderName, content] of Object.entries(folders)) {
      if (folderName !== '__bookmarks__') {
        lines.push(`${indent}<DT><H3>${escapeHtml(folderName)}</H3>`);
        lines.push(`${indent}<DL><p>`);
        
        // Add bookmarks in this folder
        if (content.__bookmarks__ && Array.isArray(content.__bookmarks__)) {
          for (const bookmark of content.__bookmarks__) {
            lines.push(`${indent}  <DT><A HREF="${escapeHtml(bookmark.url)}">${escapeHtml(bookmark.title)}</A>`);
          }
        }
        
        // Recursively add subfolders
        buildFolderHtml(content, depth + 1);
        
        lines.push(`${indent}</DL><p>`);
      }
    }
  };

  // Add root bookmarks first
  if (folderStructure.__bookmarks__) {
    for (const bookmark of folderStructure.__bookmarks__) {
      lines.push(`  <DT><A HREF="${escapeHtml(bookmark.url)}">${escapeHtml(bookmark.title)}</A>`);
    }
  }

  // Then add folders
  const { __bookmarks__, ...folders } = folderStructure;
  buildFolderHtml(folders);

  lines.push('</DL><p>');

  return lines.join('\n');
}

function buildFolderStructure(bookmarks: Bookmark[]) {
  const structure: Record<string, any> = {};

  for (const bookmark of bookmarks) {
    if (!bookmark.folder) {
      // Root bookmarks
      if (!structure.__bookmarks__) {
        structure.__bookmarks__ = [];
      }
      structure.__bookmarks__.push(bookmark);
    } else {
      // Nested bookmarks
      const parts = bookmark.folder.split(' / ');
      let current = structure;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {};
        }
        if (i === parts.length - 1) {
          // Last part - add bookmark
          if (!current[part].__bookmarks__) {
            current[part].__bookmarks__ = [];
          }
          current[part].__bookmarks__.push(bookmark);
        }
        current = current[part];
      }
    }
  }

  return structure;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
