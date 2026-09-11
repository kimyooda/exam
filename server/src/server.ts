import cors from 'cors';
import express from 'express';
import { menuRoutes } from './routes/menuRoutes.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/menus', menuRoutes);

app.listen(port, () => {
  console.log(`API server is running on http://localhost:${port}`);
});
