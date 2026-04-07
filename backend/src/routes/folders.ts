import { Router } from 'express';
import prisma from '../db';

const router = Router();

// Get all folders
router.get('/', async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get folders by parent
router.get('/parent/:parentPath', async (req, res) => {
  try {
    const parentPath = decodeURIComponent(req.params.parentPath);
    const folders = await prisma.folder.findMany({
      where: { parent: parentPath },
      orderBy: { name: 'asc' },
    });
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create a folder
router.post('/', async (req, res) => {
  try {
    const { name, parent } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // Check if folder already exists
    const existing = await prisma.folder.findFirst({
      where: { name, parent: parent || null },
    });

    if (existing) {
      return res.status(400).json({ error: 'Folder already exists' });
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parent: parent || null,
      },
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Delete a folder
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if folder has bookmarks
    const folderPath = folder.parent ? `${folder.parent} / ${folder.name}` : folder.name;
    const bookmarkCount = await prisma.bookmark.count({
      where: {
        folder: {
          startsWith: folderPath,
        },
      },
    });

    if (bookmarkCount > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with bookmarks. Move or delete bookmarks first.' });
    }

    // Check if folder has subfolders
    const subfolderCount = await prisma.folder.count({
      where: { parent: folderPath },
    });

    if (subfolderCount > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with subfolders. Delete subfolders first.' });
    }

    await prisma.folder.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Rename a folder
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const oldPath = folder.parent ? `${folder.parent} / ${folder.name}` : folder.name;
    const newPath = folder.parent ? `${folder.parent} / ${name}` : name;

    // Update the folder
    const updated = await prisma.folder.update({
      where: { id },
      data: { name },
    });

    // Update all bookmarks in this folder and subfolders
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        folder: {
          startsWith: oldPath,
        },
      },
    });

    for (const bookmark of bookmarks) {
      const newFolder = bookmark.folder?.replace(oldPath, newPath);
      await prisma.bookmark.update({
        where: { id: bookmark.id },
        data: { folder: newFolder },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

export default router;
