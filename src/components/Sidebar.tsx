import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, BarChart3, Calendar } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Sistema Despacho</h1>
        <div className="brand-sub">Gestión de Expedientes</div>
      </div>
      <nav className="sidebar-nav">
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
        <NavLink to="/agenda" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Calendar />
          Agenda
        </NavLink>
        <NavLink to="/empleados" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users />
          Empleados
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        © 2026 Despacho Fiscal
      </div>
    </aside>
  );
}
