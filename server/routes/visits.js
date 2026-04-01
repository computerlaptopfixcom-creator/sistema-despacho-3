import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const mapRow = (r) => ({
  id: r.id,
  clienteId: r.cliente_id,
  fecha: typeof r.fecha === 'object' ? r.fecha.toISOString().split('T')[0] : r.fecha,
  hora: r.hora,
  estado: r.estado,
  notas: r.notas || '',
  documentosRecibidos: r.documentos_recibidos || [],
  documentosFaltantes: r.documentos_faltantes || '',
  atendidoPor: r.atendido_por || '',
  servicios: r.servicios || [],
  totalServicios: parseFloat(r.total_servicios) || 0,
});

// GET all
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM visits ORDER BY fecha DESC, hora DESC');
    res.json(rows.map(mapRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { id, clienteId, fecha, hora, estado, notas, documentosRecibidos, documentosFaltantes, atendidoPor, servicios, totalServicios } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO visits (id, cliente_id, fecha, hora, estado, notas, documentos_recibidos, documentos_faltantes, atendido_por, servicios, total_servicios)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, clienteId, fecha, hora, estado || 'Abierta', notas || '', JSON.stringify(documentosRecibidos || []), documentosFaltantes || '', atendidoPor || '', JSON.stringify(servicios || []), totalServicios || 0]
    );
    res.status(201).json(mapRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { estado, notas, documentosRecibidos, documentosFaltantes, atendidoPor, servicios, totalServicios } = req.body;
    const sets = [];
    const vals = [];
    let i = 1;

    if (estado !== undefined) { sets.push(`estado=$${i++}`); vals.push(estado); }
    if (notas !== undefined) { sets.push(`notas=$${i++}`); vals.push(notas); }
    if (documentosRecibidos !== undefined) { sets.push(`documentos_recibidos=$${i++}`); vals.push(JSON.stringify(documentosRecibidos)); }
    if (documentosFaltantes !== undefined) { sets.push(`documentos_faltantes=$${i++}`); vals.push(documentosFaltantes); }
    if (atendidoPor !== undefined) { sets.push(`atendido_por=$${i++}`); vals.push(atendidoPor); }
    if (servicios !== undefined) { sets.push(`servicios=$${i++}`); vals.push(JSON.stringify(servicios)); }
    if (totalServicios !== undefined) { sets.push(`total_servicios=$${i++}`); vals.push(totalServicios); }

    if (sets.length > 0) {
      vals.push(req.params.id);
      await pool.query(`UPDATE visits SET ${sets.join(',')} WHERE id=$${i}`, vals);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
