import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapRow = (r) => ({
  id: r.id,
  nombre: r.nombre,
  categoria: r.categoria,
  descripcion: r.descripcion || '',
  precioBase: parseFloat(r.precio_base),
  activo: r.activo,
});

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM services ORDER BY nombre');
    res.json(rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { id, nombre, categoria, descripcion, precioBase, activo } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO services (id, nombre, categoria, descripcion, precio_base, activo)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, nombre, categoria || 'General', descripcion || '', precioBase || 0, activo !== false]
    );
    res.status(201).json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { nombre, categoria, descripcion, precioBase, activo } = req.body;
    await pool.query(
      `UPDATE services SET nombre=COALESCE($1,nombre), categoria=COALESCE($2,categoria),
       descripcion=COALESCE($3,descripcion), precio_base=COALESCE($4,precio_base),
       activo=COALESCE($5,activo) WHERE id=$6`,
      [nombre, categoria, descripcion, precioBase, activo, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
