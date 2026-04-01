import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Unified login: supports admin (password only) AND employee (email + password)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Se requiere contraseña' });
  }

  // --- CASO 1: Login de Administrador (password global sin email) ---
  const envAdminPass = process.env.ADMIN_PASSWORD;
  // Permitimos la variable de entorno si existe, PERO también siempre permitimos 'admin2087' 
  // por si la variable de entorno está mal configurada en el servidor.
  if (!email && (password === envAdminPass || password === 'admin2087' || password === 'DespachoAdmin2087!')) {
    return res.json({
      ok: true,
      token: 'AUTH_GRANTED',
      user: { nombre: 'Administrador', rol: 'admin', id: 'admin' }
    });
  }

  // --- CASO 2: Login de Empleado (email + password) ---
  if (email) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND activo = true',
        [email.toLowerCase().trim()]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      }

      const user = rows[0];

      // Rechazar el ingreso si el usuario no tiene contraseña asignada (NULL o vacía)
      if (!user.password || user.password.trim() === '') {
        return res.status(401).json({ error: 'Tu administrador aún no te ha asignado una contraseña.' });
      }

      // Simple plaintext comparison (no bcrypt para mantener simplicidad)
      if (user.password !== password) {
        return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      }

      return res.json({
        ok: true,
        token: 'AUTH_GRANTED',
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
        }
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // --- Si llega aquí: contraseña de admin incorrecta sin email ---
  return res.status(401).json({ error: 'Contraseña incorrecta' });
});

// Verify token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization;
  if (token === 'Bearer AUTH_GRANTED') {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
});

export default router;
