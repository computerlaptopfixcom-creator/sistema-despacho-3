import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapRow = (r) => ({
  id: r.id,
  clienteId: r.cliente_id || undefined,
  clienteNombre: r.cliente_nombre,
  clienteTelefono: r.cliente_telefono,
  clienteEmail: r.cliente_email,
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

// POST create (sin auto-creación de cliente)
router.post('/', async (req, res) => {
  try {
    const { id, fecha, hora, motivo, estado, notas } = req.body;
    let { clienteId, clienteNombre, clienteTelefono, clienteEmail, atiendeSeleccionado } = req.body;

    // Asignación de atiendeId basado en el servicio (motivo) o selección del usuario
    let atiendeId = null;
    if (atiendeSeleccionado) {
        const { rows: userRows } = await pool.query('SELECT id FROM users WHERE nombre ILIKE $1', [`%${atiendeSeleccionado.trim()}%`]);
        if (userRows.length > 0) atiendeId = userRows[0].id;
    } else if (motivo) {
        const { rows: srvRows } = await pool.query('SELECT atiende FROM services WHERE nombre = $1', [motivo]);
        if (srvRows.length > 0 && srvRows[0].atiende) {
            const atiendeName = srvRows[0].atiende.split(' / ')[0].trim();
            const { rows: userRows } = await pool.query('SELECT id FROM users WHERE nombre ILIKE $1', [`%${atiendeName}%`]);
            if (userRows.length > 0) atiendeId = userRows[0].id;
        }
    }

    const { rows } = await pool.query(
      `INSERT INTO appointments (id, cliente_id, cliente_nombre, cliente_telefono, cliente_email, fecha, hora, motivo, estado, notas, assigned_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, clienteId || null, clienteNombre, clienteTelefono, clienteEmail || '', fecha, hora, motivo || 'Consulta general', estado || 'Programada', notas || '', atiendeId]
    );
    res.status(201).json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { estado, notas, clienteNombre, clienteTelefono, clienteEmail, motivo } = req.body;
    const sets = [];
    const vals = [];
    let i = 1;

    if (estado !== undefined) { sets.push(`estado=$${i++}`); vals.push(estado); }
    if (notas !== undefined) { sets.push(`notas=$${i++}`); vals.push(notas); }
    if (clienteNombre !== undefined) { sets.push(`cliente_nombre=$${i++}`); vals.push(clienteNombre); }
    if (clienteTelefono !== undefined) { sets.push(`cliente_telefono=$${i++}`); vals.push(clienteTelefono); }
    if (clienteEmail !== undefined) { sets.push(`cliente_email=$${i++}`); vals.push(clienteEmail); }
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
