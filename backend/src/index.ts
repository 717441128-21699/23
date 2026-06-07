import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import tasksRouter from './routes/tasks.js';
import alertsRouter from './routes/alerts.js';
import reportsRouter from './routes/reports.js';
import recommendRouter from './routes/recommend.js';
import approvalsRouter from './routes/approvals.js';
import statsRouter from './routes/stats.js';
import simulateRouter from './routes/simulate.js';
import { db } from './db/inMemoryDB.js';

const app = express();
const PORT = 3001;

db.seed();

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5176',
      'http://127.0.0.1:5177',
      'http://127.0.0.1:5178',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

app.use('/api/tasks', tasksRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/recommend', recommendRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/simulate', simulateRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] Micromag backend running on http://localhost:${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
});

export default app;
