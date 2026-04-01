import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';
import clientsRouter from './routes/clients.js';
import visitsRouter from './routes/visits.js';
import servicesRouter from './routes/services.js';
import paymentsRouter from './routes/payments.js';
import appointmentsRouter from './routes/appointments.js';
import authRouter from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/appointments', appointmentsRouter);


// Serve frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Start
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
}

start();
