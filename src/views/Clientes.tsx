import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Phone } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import type { Client } from '../types';

export default function Clientes() {
  const { db, addClient } = useGlobalState();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return db.clients;
    const q = searchQuery.toLowerCase();
    return db.clients.filter(
      c => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
    );
  }, [searchQuery, db.clients]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [filteredClients]);

  const getLastVisitDate = (clientId: string) => {
    const visits = db.visits
      .filter(v => v.clienteId === clientId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    return visits.length > 0 ? visits[0].fecha : null;
  };

  const getVisitCount = (clientId: string) => {
    return db.visits.filter(v => v.clienteId === clientId).length;
  };

  const handleQuickCreate = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const client: Client = {
      id: crypto.randomUUID(),
      nombre: newName.trim(),
      telefono: newPhone.trim(),
      email: newEmail.trim(),
      fechaAlta: new Date().toISOString(),
    };
    addClient(client);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setShowNewClient(false);
    navigate(`/clientes/${client.id}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="subtitle">{db.clients.length} clientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewClient(true)}>
          <UserPlus size={18} /> Alta Rápida
        </button>
      </div>

      {/* Search */}
      <div className="search-bar mb-4">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Client Table */}
      <div className="card">
        {sortedClients.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Visitas</th>
                  <th>Última Visita</th>
                  <th>Fecha de Alta</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map(c => (
                  <tr
                    key={c.id}
                    className="clickable"
                    onClick={() => navigate(`/clientes/${c.id}`)}
                  >
                    <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                        {c.telefono}
                      </span>
                    </td>
                    <td>{getVisitCount(c.id)}</td>
                    <td className="text-secondary">
                      {getLastVisitDate(c.id) ? formatDate(getLastVisitDate(c.id)!) : '—'}
                    </td>
                    <td className="text-muted text-sm">
                      {formatDate(c.fechaAlta.split('T')[0])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            {searchQuery ? 'No se encontraron clientes con ese criterio.' : 'No hay clientes registrados aún.'}
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showNewClient && (
        <div className="modal-overlay" onClick={() => setShowNewClient(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Alta Rápida de Cliente</h2>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                type="text"
                placeholder="Ej: María López Hernández"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                placeholder="Ej: maria.lopez@email.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
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
                <UserPlus size={16} /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
