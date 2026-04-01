import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapRow = (r) => ({
  id: r.id,
  nombre: r.nombre,
  email: r.email,
  telefono: r.telefono || '',
  rol: r.rol || 'contador',
  activo: r.activo,
  visible: r.visible,
  disponibilidad: r.disponibilidad || 'Disponible',
  fechaAlta: r.fecha_alta,
});

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY nombre');
    res.json(rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { nombre, email, password, telefono, rol, activo, visible, disponibilidad } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO users (nombre, email, password, telefono, rol, activo, visible, disponibilidad)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nombre, email, password || null, telefono || '', rol || 'contador', activo !== false, visible !== false, disponibilidad || 'Disponible']
    );
    res.status(201).json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { nombre, email, password, telefono, rol, activo, visible, disponibilidad } = req.body;
    await pool.query(
      `UPDATE users SET 
        nombre=COALESCE($1, nombre), 
        email=COALESCE($2, email),
        password=COALESCE($3, password),
        telefono=COALESCE($4, telefono), 
        rol=COALESCE($5, rol), 
        activo=COALESCE($6, activo), 
        visible=COALESCE($7, visible), 
        disponibilidad=COALESCE($8, disponibilidad) 
      WHERE id=$9`,
      [nombre, email, password === '' ? null : password, telefono, rol, activo, visible, disponibilidad, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
