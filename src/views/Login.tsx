import { useState } from 'react';
import { Lock, LogIn, Mail, ChevronDown, ChevronUp } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (user?: any) => void }) {
  const [mode, setMode] = useState<'employee' | 'admin'>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = mode === 'admin'
        ? { password }
        : { email: email.trim(), password };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        localStorage.setItem('despacho3_token', data.token);
        if (data.user) {
          localStorage.setItem('despacho3_user', JSON.stringify(data.user));
        }
        onLogin(data.user);
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const isValid = mode === 'admin' ? !!password : !!(email && password);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100%', background: 'var(--bg-main)', padding: 24,
    }}>
      <div style={{
        background: 'var(--card-bg)', padding: 40, borderRadius: 16,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '100%', maxWidth: 420,
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
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            {mode === 'employee' ? 'Acceso de Empleados' : 'Acceso de Administración'}
          </p>
        </div>

        {/* Tabs de Modo */}
        <div style={{
          display: 'flex', background: '#f1f5f9', borderRadius: 8,
          padding: 4, marginBottom: 24, gap: 4,
        }}>
          <button
            type="button"
            onClick={() => { setMode('employee'); setError(''); }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: mode === 'employee' ? 'var(--accent-blue)' : 'transparent',
              color: mode === 'employee' ? 'white' : '#64748b',
            }}
          >
            Empleado
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin'); setError(''); }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: mode === 'admin' ? '#475569' : 'transparent',
              color: mode === 'admin' ? 'white' : '#64748b',
            }}
          >
            Administrador
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'employee' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@despacho.com"
                  style={{
                    width: '100%', padding: '12px 16px 12px 40px', borderRadius: 8,
                    border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                    color: 'var(--text-main)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-main)',
                color: 'var(--text-main)', fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
              }}
              autoFocus={mode === 'admin'}
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
            disabled={loading || !isValid}
            style={{
              width: '100%',
              background: mode === 'employee' ? 'var(--accent-blue)' : '#475569',
              color: '#fff',
              border: 'none', padding: '14px', borderRadius: 8,
              fontSize: '1rem', fontWeight: 600,
              cursor: loading || !isValid ? 'not-allowed' : 'pointer',
              opacity: loading || !isValid ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s', boxSizing: 'border-box',
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
