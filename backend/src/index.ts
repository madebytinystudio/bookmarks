import express from 'express';
import cors from 'cors';
import bookmarksRouter from './routes/bookmarks';
import foldersRouter from './routes/folders';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/folders', foldersRouter);

app.get('/', (_req, res) => {
  res.send({ status: 'ok', message: 'Bookmark service is running' });
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
