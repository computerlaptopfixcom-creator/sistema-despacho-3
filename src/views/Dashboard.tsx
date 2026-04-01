import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Users, CalendarCheck, Clock, PlusCircle, AlertTriangle, FileX, DollarSign, Calendar } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import type { Client } from '../types';

export default function Dashboard() {
  const { db, addClient, addVisit } = useGlobalState();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [showNewClient, setShowNewClient] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return db.clients.filter(
      c => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
    );
  }, [searchQuery, db.clients]);

  const todayVisits = useMemo(() => {
    return db.visits
      .filter(v => v.fecha === today)
      .map(v => {
        const client = db.clients.find(c => c.id === v.clienteId);
        return { ...v, clienteNombre: client?.nombre || 'Sin nombre' };
      })
      .sort((a, b) => b.hora.localeCompare(a.hora));
  }, [db.visits, db.clients, today]);

  const pendingVisits = db.visits.filter(v => v.estado === 'Pendiente').length;

  // Smart Alerts
  const alerts = useMemo(() => {
    const items: { type: 'warning' | 'danger' | 'info'; icon: any; message: string; action?: () => void }[] = [];

    // Pending payments
    const visitsWithDebt = db.visits.filter(v => {
      const totalServ = (v.servicios || []).reduce((s: number, sv: any) => s + sv.subtotal, 0);
      const totalPaid = db.payments.filter(p => p.visitaId === v.id).reduce((s, p) => s + p.monto, 0);
      return totalServ > 0 && totalPaid < totalServ && v.estado !== 'Finalizada';
    });
    if (visitsWithDebt.length > 0) {
      const totalDebt = visitsWithDebt.reduce((sum, v) => {
        const totalServ = (v.servicios || []).reduce((s: number, sv: any) => s + sv.subtotal, 0);
        const totalPaid = db.payments.filter(p => p.visitaId === v.id).reduce((s, p) => s + p.monto, 0);
        return sum + (totalServ - totalPaid);
      }, 0);
      items.push({
        type: 'danger',
        icon: DollarSign,
        message: `${visitsWithDebt.length} atención(es) con saldo pendiente (${totalDebt.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })})`,
        action: () => navigate('/reportes'),
      });
    }

    // Missing documents (visits with missing docs open for > 3 days)
    const oldOpenVisits = db.visits.filter(v => {
      if (v.estado === 'Finalizada') return false;
      const missing = v.documentosRecibidos.filter(d => !d.recibido).length;
      if (missing === 0) return false;
      const visitDate = new Date(v.fecha + 'T12:00:00');
      const daysSince = (Date.now() - visitDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 3;
    });
    if (oldOpenVisits.length > 0) {
      items.push({
        type: 'warning',
        icon: FileX,
        message: `${oldOpenVisits.length} atención(es) con documentos faltantes hace más de 3 días`,
      });
    }

    // Upcoming appointments today
    const todayAppts = db.appointments.filter(a => a.fecha === today && (a.estado === 'Programada' || a.estado === 'Confirmada'));
    if (todayAppts.length > 0) {
      items.push({
        type: 'info',
        icon: Calendar,
        message: `${todayAppts.length} cita(s) programada(s) para hoy`,
        action: () => navigate('/agenda'),
      });
    }

    return items;
  }, [db.visits, db.payments, db.appointments, today]);

  const todayApptsCount = db.appointments.filter(a => a.fecha === today && a.estado !== 'Cancelada').length;

  const handleQuickCreate = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const client: Client = {
      id: crypto.randomUUID(),
      nombre: newName.trim(),
      telefono: newPhone.trim(),
      fechaAlta: new Date().toISOString(),
    };
    addClient(client);
    setNewName('');
    setNewPhone('');
    setShowNewClient(false);
    navigate(`/clientes/${client.id}`);
  };

  const handleWalkIn = () => {
    setShowNewClient(true);
  };

  const handleStartVisitForResult = (client: Client) => {
    const visitId = crypto.randomUUID();
    const now = new Date();
    addVisit({
      id: visitId,
      clienteId: client.id,
      fecha: now.toISOString().split('T')[0],
      hora: now.toTimeString().slice(0, 5),
      estado: 'Abierta',
      notas: '',
      documentosRecibidos: [
        { nombre: 'INE / Identificación', recibido: false },
        { nombre: 'CURP', recibido: false },
        { nombre: 'Constancia de Semanas Cotizadas', recibido: false },
        { nombre: 'Estado de Cuenta AFORE', recibido: false },
        { nombre: 'Constancia de Situación Fiscal', recibido: false },
        { nombre: 'Comprobante de Domicilio', recibido: false },
      ],
      documentosFaltantes: '',
      atendidoPor: '',
      servicios: [],
      totalServicios: 0,
    });
    navigate(`/visita/${visitId}`);
  };

  const getStatusBadge = (estado: string) => {
    const map: Record<string, string> = {
      'Abierta': 'badge-blue',
      'En Proceso': 'badge-purple',
      'Pendiente': 'badge-amber',
      'Finalizada': 'badge-green',
    };
    return map[estado] || 'badge-blue';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Resumen del día y acceso rápido</p>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar mb-4">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o teléfono..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="card mb-4">
          <h3 style={{ marginBottom: 12, fontSize: '0.95rem' }}>
            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
          </h3>
          {searchResults.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                      <td>{c.telefono}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => navigate(`/clientes/${c.id}`)}>
                            Ver Expediente
                          </button>
                          <button className="btn btn-sm btn-primary" onClick={() => handleStartVisitForResult(c)}>
                            <PlusCircle size={14} /> Nueva Atención
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">No se encontraron clientes. <button onClick={() => setShowNewClient(true)} style={{ color: 'var(--accent-blue)', background:'none', textDecoration:'underline', fontWeight:600 }}>Crear nuevo cliente</button></p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-lg" onClick={() => setShowNewClient(true)}>
          <UserPlus size={20} /> Nuevo Cliente
        </button>
        <button className="btn btn-success btn-lg" onClick={handleWalkIn}>
          <PlusCircle size={20} /> Atención sin Cita
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{db.clients.length}</div>
            <div className="stat-label">Clientes registrados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)' }}>
            <CalendarCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{todayVisits.length}</div>
            <div className="stat-label">Atenciones hoy</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">{pendingVisits}</div>
            <div className="stat-label">Visitas pendientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-purple-light)', color: 'var(--accent-purple)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-value">{todayApptsCount}</div>
            <div className="stat-label">Citas hoy</div>
          </div>
        </div>
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="card mb-4">
          <h3 style={{ marginBottom: 12, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} style={{ color: 'var(--accent-amber)' }} />
            Alertas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((alert, i) => {
              const colorMap = { warning: 'var(--accent-amber)', danger: 'var(--accent-red)', info: 'var(--accent-blue)' };
              const bgMap = { warning: 'var(--accent-amber-light)', danger: 'var(--accent-red-light)', info: 'var(--accent-blue-light)' };
              const Icon = alert.icon;
              return (
                <div
                  key={i}
                  onClick={alert.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: bgMap[alert.type],
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `4px solid ${colorMap[alert.type]}`,
                    cursor: alert.action ? 'pointer' : 'default',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: colorMap[alert.type],
                    transition: 'all 150ms ease',
                  }}
                >
                  <Icon size={18} />
                  {alert.message}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Visits */}
      {todayVisits.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Atenciones de hoy</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {todayVisits.map(v => (
                  <tr key={v.id}>
                    <td>{v.hora}</td>
                    <td style={{ fontWeight: 600 }}>{v.clienteNombre}</td>
                    <td><span className={`badge ${getStatusBadge(v.estado)}`}>{v.estado}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate(`/visita/${v.id}`)}>
                        Continuar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showNewClient && (
        <div className="modal-overlay" onClick={() => setShowNewClient(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Alta Rápida de Cliente</h2>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez García"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Teléfono *</label>
              <input
                type="tel"
                placeholder="Ej: 656 123 4567"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickCreate()}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowNewClient(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleQuickCreate}
                disabled={!newName.trim() || !newPhone.trim()}
              >
                <UserPlus size={16} /> Registrar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
