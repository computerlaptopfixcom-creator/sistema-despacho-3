import { Router } from 'express';

const router = Router();

// A simple login route for the single-user admin interface
router.post('/login', (req, res) => {
  const { password } = req.body;
  
  // Use environment variable ADMIN_PASSWORD, or fallback to default 'admin2087'
  const validPassword = process.env.ADMIN_PASSWORD || 'admin2087';
  
  if (password === validPassword) {
    // Return a simple success flag and a dummy token (could be a real JWT if needed)
    res.json({ ok: true, token: 'AUTH_GRANTED' });
  } else {
    res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});

// Optional: verify token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization;
  if (token === 'Bearer AUTH_GRANTED') {
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
});

export default router;
