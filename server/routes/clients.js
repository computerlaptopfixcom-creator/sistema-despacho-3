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
      email: r.email || '',
      curp: r.curp || '',
      nss: r.nss || '',
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
    let { id, nombre, telefono, email, curp, nss, notasGenerales, fechaAlta } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO clients (id, nombre, telefono, email, curp, nss, notas_generales, fecha_alta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, nombre, telefono, email || '', curp || '', nss || '', notasGenerales || '', fechaAlta || new Date().toISOString()]
    );
    const r = rows[0];
    res.status(201).json({
      id: r.id, nombre: r.nombre, telefono: r.telefono, email: r.email,
      curp: r.curp, nss: r.nss, notasGenerales: r.notas_generales, fechaAlta: r.fecha_alta,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { nombre, telefono, email, curp, nss, notasGenerales } = req.body;
    await pool.query(
      `UPDATE clients SET nombre=COALESCE($1,nombre), telefono=COALESCE($2,telefono),
       email=COALESCE($3,email), curp=COALESCE($4,curp), nss=COALESCE($5,nss), notas_generales=COALESCE($6,notas_generales) WHERE id=$7`,
      [nombre, telefono, email, curp, nss, notasGenerales, req.params.id]
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
