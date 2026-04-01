import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useGlobalState } from './context/GlobalState';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Clientes from './views/Clientes';
import Expediente from './views/Expediente';
import Visita from './views/Visita';
import Catalogo from './views/Catalogo';
import Reportes from './views/Reportes';
import Agenda from './views/Agenda';
import AgendarPublico from './views/AgendarPublico';
import Login from './views/Login';
import './App.css';

function AdminLayout() {
  const { loading } = useGlobalState();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: 16,
        background: 'var(--bg-main)',
      }}>
        <div style={{
          width: 40, height: 40, border: '4px solid var(--border-color)',
          borderTopColor: 'var(--accent-blue)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando sistema...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<Expediente />} />
          <Route path="/visita/:id" element={<Visita />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/agenda" element={<Agenda />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isPublic = location.pathname === '/agendar';

  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('despacho3_token') === 'AUTH_GRANTED'
  );

  // Verificación adicional de token contra el API (opcional)
  useEffect(() => {
    if (isAuthenticated && !isPublic) {
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('despacho3_token')}` }
      })
        .then(res => {
          if (!res.ok) {
            localStorage.removeItem('despacho3_token');
            setIsAuthenticated(false);
          }
        })
        .catch(() => { });
    }
  }, [location.pathname]);

  if (isPublic) {
    return <AgendarPublico />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <AdminLayout />;
}

