import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapRow = (r) => ({
  id: r.id,
  clienteId: r.cliente_id || undefined,
  clienteNombre: r.cliente_nombre,
  clienteTelefono: r.cliente_telefono,
  fecha: typeof r.fecha === 'object' ? r.fecha.toISOString().split('T')[0] : r.fecha,
  hora: r.hora,
  motivo: r.motivo || 'Consulta general',
  estado: r.estado,
  notas: r.notas || '',
});

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM appointments ORDER BY fecha DESC, hora ASC');
    res.json(rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { id, clienteId, clienteNombre, clienteTelefono, fecha, hora, motivo, estado, notas } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO appointments (id, cliente_id, cliente_nombre, cliente_telefono, fecha, hora, motivo, estado, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, clienteId || null, clienteNombre, clienteTelefono, fecha, hora, motivo || 'Consulta general', estado || 'Programada', notas || '']
    );
    res.status(201).json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { estado, notas, clienteNombre, clienteTelefono, motivo } = req.body;
    const sets = [];
    const vals = [];
    let i = 1;

    if (estado !== undefined) { sets.push(`estado=$${i++}`); vals.push(estado); }
    if (notas !== undefined) { sets.push(`notas=$${i++}`); vals.push(notas); }
    if (clienteNombre !== undefined) { sets.push(`cliente_nombre=$${i++}`); vals.push(clienteNombre); }
    if (clienteTelefono !== undefined) { sets.push(`cliente_telefono=$${i++}`); vals.push(clienteTelefono); }
    if (motivo !== undefined) { sets.push(`motivo=$${i++}`); vals.push(motivo); }

    if (sets.length > 0) {
      vals.push(req.params.id);
      await pool.query(`UPDATE appointments SET ${sets.join(',')} WHERE id=$${i}`, vals);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM appointments WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
