import { Router } from 'express';
import multer from 'multer';
import prisma from '../db';
import { parseSafariBookmarks, generateSafariBookmarksHtml } from '../services/bookmarkParser';
import { getWebsiteMetadata } from '../services/metadataFetcher';

const router = Router();
const upload = multer();

router.get('/', async (req, res) => {
  const { q, sort } = req.query;
  const where = q
    ? {
        OR: [
          { title: { contains: String(q) } },
          { url: { contains: String(q) } },
          { folder: { contains: String(q) } },
        ],
      }
    : {};

  const orderBy = sort === 'title' ? { title: 'asc' as const } : sort === 'createdAt' ? { createdAt: 'desc' as const } : { order: 'asc' as const };

  const bookmarks = await prisma.bookmark.findMany({ where, orderBy });
  res.json(bookmarks);
});

router.get('/metadata/snapshot', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const metadata = await getWebsiteMetadata(url);
    res.json(metadata || {});
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

router.post('/', async (req, res) => {
  const { title, url, folder } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }

  const bookmark = await prisma.bookmark.create({ data: { title, url, folder: folder || null } });
  res.status(201).json(bookmark);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { title, url, folder, order } = req.body;
  
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (url !== undefined) updateData.url = url;
  if (folder !== undefined) updateData.folder = folder;
  if (order !== undefined) updateData.order = order;

  if (!Object.keys(updateData).length) {
    return res.status(400).json({ error: 'At least one field to update is required' });
  }

  const bookmark = await prisma.bookmark.update({
    where: { id },
    data: updateData,
  });
  res.json(bookmark);
});

router.get('/export', async (req, res) => {
  const bookmarks = await prisma.bookmark.findMany();
  const html = generateSafariBookmarksHtml(bookmarks);
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', 'attachment; filename=\"bookmarks.html\"');
  res.send(html);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  try {
    const bookmark = await prisma.bookmark.delete({
      where: { id },
    });
    res.json({ success: true, bookmark });
  } catch (error) {
    res.status(404).json({ error: 'Bookmark not found' });
  }
});

router.post('/import', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'HTML file was not uploaded' });
  }

  const html = file.buffer.toString('utf-8');
  const items = parseSafariBookmarks(html);
  const created = [];

  for (const item of items) {
    const bookmark = await prisma.bookmark.create({ data: item });
    created.push(bookmark);
  }

  res.status(201).json({ imported: created.length, bookmarks: created });
});


export default router;
