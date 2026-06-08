import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import testsRouter from './routes/tests.js';
import benchmarksRouter from './routes/benchmarks.js';
import passRouter from './routes/pass.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/tests', testsRouter);
app.use('/api/benchmarks', benchmarksRouter);
app.use('/api/pass-output', passRouter);

// Serve static assets in production
const frontendDistPath = path.join(__dirname, '../dist');
app.use(express.static(frontendDistPath));

// Fallback to SPA router for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[API Server] Running at http://localhost:${PORT}`);
});
