import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename to avoid overwrites
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// GET documents for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM client_documents WHERE client_id = $1 ORDER BY upload_date DESC',
      [req.params.clientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload document for client
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    const { clientId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    if (!clientId) {
      // Clean up file if missing client ID
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Falta proveer el ID del cliente' });
    }

    const { rows } = await pool.query(
      `INSERT INTO client_documents (client_id, filename, original_name, filepath, mimetype, size)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [clientId, file.filename, file.originalname, `/uploads/${file.filename}`, file.mimetype, file.size]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE document
router.delete('/:id', async (req, res) => {
  try {
    const docId = req.params.id;
    // Get file info to delete from disk
    const { rows } = await pool.query('SELECT filename FROM client_documents WHERE id = $1', [docId]);
    if (rows.length > 0) {
      const filePath = path.join(uploadsDir, rows[0].filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await pool.query('DELETE FROM client_documents WHERE id = $1', [docId]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
