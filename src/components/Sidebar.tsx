import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, BarChart3, Calendar, LogOut, X } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const { currentUser, logout } = useGlobalState();
  const isContador = currentUser?.rol === 'contador';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Sistema Despacho</h1>
          <div className="brand-sub">
            {currentUser
              ? `${currentUser.nombre} (${isContador ? 'Contador' : 'Admin'})`
              : 'Gestión de Expedientes'}
          </div>
        </div>
        <button className="mobile-close-btn" onClick={onClose} aria-label="Cerrar menú">
          <X size={24} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {!isContador && (
          <>
            <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard />
              Dashboard
            </NavLink>
            <NavLink to="/clientes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users />
              Clientes
            </NavLink>
            <NavLink to="/catalogo" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Package />
              Catálogo
            </NavLink>
            <NavLink to="/reportes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <BarChart3 />
              Reportes
            </NavLink>
          </>
        )}
        <NavLink to="/agenda" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Calendar />
          {isContador ? 'Mi Agenda' : 'Agenda'}
        </NavLink>
        {!isContador && (
          <NavLink to="/empleados" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users />
            Empleados
          </NavLink>
        )}
      </nav>
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(239, 68, 68, 0.1)', border: 'none',
            color: '#ef4444', borderRadius: 8, padding: '8px 12px',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%',
          }}
        >
          <LogOut size={15} />
          Cerrar Sesión
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          © 2026 Despacho Fiscal
        </div>
      </div>
    </aside>
  );
}
