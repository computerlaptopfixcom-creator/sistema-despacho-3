import { useState } from 'react';
import { 
  Search, Filter, Plus, MoreHorizontal, Calendar, 
  User as UserIcon, Eye, CheckCircle2, XCircle, Grid, List 
} from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import type { User } from '../types';

export default function Empleados() {
  const { db, updateUser, addUser } = useGlobalState();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredUsers = db.users.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleVisibility = (id: string, current: boolean) => {
    updateUser(id, { visible: !current });
  };

  const toggleActive = (id: string, current: boolean) => {
    updateUser(id, { activo: !current });
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div className="header-title">
          <div className="header-icon employees-icon">
            <UserIcon size={24} />
          </div>
          <div>
            <h1>Empleados</h1>
            <p>Gestiona el personal y los contadores del despacho</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar empleados..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-icon">
            <Filter size={18} />
          </button>
          <div className="view-toggle">
            <button 
              className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
            <button 
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>Empleado</span>
          </button>
        </div>
      </header>

      <div className="content-card">
        {viewMode === 'list' ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}><input type="checkbox" /></th>
                  <th>ID</th>
                  <th>NOMBRE</th>
                  <th>VISIBILIDAD</th>
                  <th>DISPONIBILIDAD</th>
                  <th>TELÉFONO</th>
                  <th>CORREO ELECTRÓNICO</th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td><input type="checkbox" /></td>
                    <td><span className="text-muted">{index + 3}</span></td>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar">
                          <UserIcon size={16} />
                        </div>
                        <div>
                          <div className="user-name">{user.nombre}</div>
                          <span className="tag tag-popular">Más populares</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button 
                        className={`status-badge ${user.visible ? 'visible' : 'hidden'}`}
                        onClick={() => toggleVisibility(user.id, user.visible)}
                      >
                        <Eye size={14} />
                        <span>{user.visible ? 'Visible' : 'Oculto'}</span>
                      </button>
                    </td>
                    <td>
                      <div className={`dispo-badge ${user.disponibilidad.toLowerCase()}`}>
                        <span>{user.disponibilidad}</span>
                      </div>
                    </td>
                    <td><span className="text-phone">{user.telefono}</span></td>
                    <td><span className="text-email">{user.email}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-outline btn-sm">Ver en el calendario</button>
                        <button className="btn-icon-sm">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid-container">
            {/* Grid view implementation can go here if needed later */}
            <p className="text-muted" style={{ padding: 20 }}>Vista de cuadrícula en desarrollo...</p>
          </div>
        )}
      </div>

      <style>{`
        .user-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }
        .user-name {
          font-weight: 600;
          color: #1e293b;
        }
        .tag-popular {
          background: #2563eb;
          color: white;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 10px;
          margin-left: 0;
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
        }
        .status-badge.visible {
          background: #f0fdf4;
          color: #16a34a;
        }
        .status-badge.hidden {
          background: #fef2f2;
          color: #dc2626;
        }
        .dispo-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .dispo-badge.disponible {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bcf0da;
        }
        .text-phone, .text-email {
          font-size: 13px;
          color: #4f46e5;
        }
        .table-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
        .btn-outline.btn-sm {
          padding: 6px 12px;
          font-size: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          color: #475569;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-outline.btn-sm:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .btn-icon-sm {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .view-toggle {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 8px;
          gap: 2px;
        }
        .view-toggle .btn-icon {
          background: none;
          border-radius: 6px;
        }
        .view-toggle .btn-icon.active {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          color: #2563eb;
        }
      `}</style>
    </div>
  );
}
