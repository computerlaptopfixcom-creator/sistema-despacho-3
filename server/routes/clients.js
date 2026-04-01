import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients ORDER BY fecha_alta DESC');
    res.json(rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      telefono: r.telefono,
      curp: r.curp || '',
      notasGenerales: r.notas_generales || '',
      fechaAlta: r.fecha_alta,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { id, nombre, telefono, curp, notasGenerales, fechaAlta } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO clients (id, nombre, telefono, curp, notas_generales, fecha_alta)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, nombre, telefono, curp || '', notasGenerales || '', fechaAlta || new Date().toISOString()]
    );
    const r = rows[0];
    res.status(201).json({
      id: r.id, nombre: r.nombre, telefono: r.telefono,
      curp: r.curp, notasGenerales: r.notas_generales, fechaAlta: r.fecha_alta,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { nombre, telefono, curp, notasGenerales } = req.body;
    await pool.query(
      `UPDATE clients SET nombre=COALESCE($1,nombre), telefono=COALESCE($2,telefono),
       curp=COALESCE($3,curp), notas_generales=COALESCE($4,notas_generales) WHERE id=$5`,
      [nombre, telefono, curp, notasGenerales, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
