import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapRow = (r) => ({
  id: r.id,
  visitaId: r.visita_id,
  clienteId: r.cliente_id,
  monto: parseFloat(r.monto),
  fecha: r.fecha,
  metodo: r.metodo,
  folio: r.folio,
  notas: r.notas || '',
});

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM payments ORDER BY fecha DESC');
    res.json(rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { id, visitaId, clienteId, monto, fecha, metodo, folio, notas } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO payments (id, visita_id, cliente_id, monto, fecha, metodo, folio, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, visitaId, clienteId, monto, fecha || new Date().toISOString(), metodo, folio, notas || '']
    );
    res.status(201).json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
