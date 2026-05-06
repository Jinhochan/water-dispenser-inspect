import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/init.js';
import devicesRouter from './routes/devices.js';
import maintenanceRouter from './routes/maintenance.js';
import usersRouter from './routes/users.js';
import statsRouter from './routes/stats.js';
import feishuRouter from './routes/feishu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/devices', devicesRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/users', usersRouter);
app.use('/api/stats', statsRouter);
app.use('/api/feishu', feishuRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from client build
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback: all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ code: 1, message: '服务器内部错误' });
});

// Initialize DB then start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
