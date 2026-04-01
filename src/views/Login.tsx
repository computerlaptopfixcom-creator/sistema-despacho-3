import { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      
      if (res.ok && data.ok) {
        localStorage.setItem('despacho3_token', data.token);
        onLogin();
      } else {
        setError(data.error || 'Contraseña incorrecta');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100%', background: 'var(--bg-main)', padding: 24,
    }}>
      <div style={{
        background: 'var(--card-bg)', padding: 40, borderRadius: 16,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '100%', maxWidth: 400,
        border: '1px solid var(--border-color)',
        animation: 'slideUp 0.3s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, background: 'var(--accent-blue)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: '#fff'
          }}>
            <Lock size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Despacho 2087</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Acceso de Administración</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Contraseña de Acceso
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                color: 'var(--text-main)', fontSize: '1rem',
                outline: 'none',
              }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem',
              marginBottom: 24, border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%', background: 'var(--accent-blue)', color: '#fff',
              border: 'none', padding: '14px', borderRadius: 8,
              fontSize: '1rem', fontWeight: 600, cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Verificando...' : (
              <>
                <LogIn size={20} />
                Ingresar al Sistema
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
