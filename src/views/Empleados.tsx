import { useState } from 'react';
import { 
  Search, Plus, MoreHorizontal,
  User as UserIcon, Eye, EyeOff, Edit2, Trash2, X, Save
} from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';

const emptyForm = {
  nombre: '',
  email: '',
  telefono: '',
  rol: 'contador' as const,
  disponibilidad: 'Disponible',
};

export default function Empleados() {
  const { db, updateUser, addUser, deleteUser } = useGlobalState();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredUsers = db.users.filter((u: any) =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setForm({
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono || '',
      rol: user.rol || 'contador',
      disponibilidad: user.disponibilidad || 'Disponible',
    });
    setEditingId(user.id);
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleSave = () => {
    if (!form.nombre.trim() || !form.email.trim()) return;

    if (editingId) {
      updateUser(editingId, {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        disponibilidad: form.disponibilidad,
      });
    } else {
      addUser({
        id: crypto.randomUUID(),
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        rol: form.rol as any,
        activo: true,
        visible: true,
        disponibilidad: form.disponibilidad,
        fechaAlta: new Date().toISOString(),
      });
    }
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    deleteUser(id);
    setConfirmDelete(null);
    setMenuOpen(null);
  };

  const toggleVisibility = (id: string, current: boolean) => {
    updateUser(id, { visible: !current });
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
              onChange={(e: any) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={18} />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </header>

      <div className="content-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>NOMBRE</th>
                <th>VISIBILIDAD</th>
                <th>DISPONIBILIDAD</th>
                <th>TELÉFONO</th>
                <th>CORREO ELECTRÓNICO</th>
                <th style={{ textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No hay empleados registrados. Haz clic en "Nuevo Empleado" para agregar uno.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user: any, index: number) => (
                <tr key={user.id}>
                  <td><span className="text-muted">{index + 1}</span></td>
                  <td>
                    <div className="emp-info-cell">
                      <div className="emp-avatar">
                        {user.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="emp-name">{user.nombre}</div>
                        <div className="emp-role">{user.rol === 'admin' ? 'Administrador' : 'Contador'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      className={`emp-status-badge ${user.visible ? 'visible' : 'hidden'}`}
                      onClick={() => toggleVisibility(user.id, user.visible)}
                      title={user.visible ? 'Clic para ocultar' : 'Clic para mostrar'}
                    >
                      {user.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      <span>{user.visible ? 'Visible' : 'Oculto'}</span>
                    </button>
                  </td>
                  <td>
                    <div className={`emp-dispo ${user.disponibilidad?.toLowerCase().replace(/\s/g, '-') || 'disponible'}`}>
                      {user.disponibilidad || 'Disponible'}
                    </div>
                  </td>
                  <td><span className="emp-contact">{user.telefono || '—'}</span></td>
                  <td><span className="emp-contact">{user.email}</span></td>
                  <td>
                    <div className="emp-actions">
                      <button className="emp-btn-edit" onClick={() => openEdit(user)} title="Editar">
                        <Edit2 size={15} />
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button className="emp-btn-menu" onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}>
                          <MoreHorizontal size={16} />
                        </button>
                        {menuOpen === user.id && (
                          <div className="emp-dropdown">
                            <button onClick={() => openEdit(user)}>
                              <Edit2 size={14} /> Editar
                            </button>
                            <button className="emp-dropdown-danger" onClick={() => setConfirmDelete(user.id)}>
                              <Trash2 size={14} /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL AGREGAR / EDITAR ── */}
      {showModal && (
        <div className="emp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="emp-modal" onClick={(e: any) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h2>{editingId ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
              <button className="emp-modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="emp-modal-body">
              <label className="emp-field">
                <span>Nombre completo *</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e: any) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </label>
              <label className="emp-field">
                <span>Correo electrónico *</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e: any) => setForm({ ...form, email: e.target.value })}
                  placeholder="Ej: juan@despacho.com"
                />
              </label>
              <label className="emp-field">
                <span>Teléfono</span>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e: any) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Ej: +52 656 123 4567"
                />
              </label>
              <div className="emp-field-row">
                <label className="emp-field">
                  <span>Rol</span>
                  <select
                    value={form.rol}
                    onChange={(e: any) => setForm({ ...form, rol: e.target.value })}
                  >
                    <option value="contador">Contador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>
                <label className="emp-field">
                  <span>Disponibilidad</span>
                  <select
                    value={form.disponibilidad}
                    onChange={(e: any) => setForm({ ...form, disponibilidad: e.target.value })}
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Ocupado">Ocupado</option>
                    <option value="Vacaciones">Vacaciones</option>
                    <option value="No disponible">No disponible</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="emp-modal-footer">
              <button className="emp-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={!form.nombre.trim() || !form.email.trim()}
              >
                <Save size={16} />
                <span>{editingId ? 'Guardar Cambios' : 'Crear Empleado'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR ELIMINACIÓN ── */}
      {confirmDelete && (
        <div className="emp-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="emp-modal emp-modal-sm" onClick={(e: any) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h2>¿Eliminar empleado?</h2>
              <button className="emp-modal-close" onClick={() => setConfirmDelete(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="emp-modal-body">
              <p style={{ color: '#64748b', margin: 0 }}>
                Esta acción no se puede deshacer. El empleado será eliminado permanentemente del sistema.
              </p>
            </div>
            <div className="emp-modal-footer">
              <button className="emp-btn-cancel" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="emp-btn-danger" onClick={() => handleDelete(confirmDelete)}>
                <Trash2 size={16} />
                <span>Sí, eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Empleados Table ── */
        .emp-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .emp-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
        }
        .emp-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }
        .emp-role {
          font-size: 12px;
          color: #94a3b8;
        }
        .emp-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .emp-status-badge.visible {
          background: #f0fdf4;
          color: #16a34a;
        }
        .emp-status-badge.visible:hover {
          background: #dcfce7;
        }
        .emp-status-badge.hidden {
          background: #fef2f2;
          color: #dc2626;
        }
        .emp-status-badge.hidden:hover {
          background: #fee2e2;
        }
        .emp-dispo {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .emp-dispo.disponible {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bcf0da;
        }
        .emp-dispo.ocupado {
          background: #fefce8;
          color: #ca8a04;
          border: 1px solid #fde68a;
        }
        .emp-dispo.vacaciones {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }
        .emp-dispo.no-disponible {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .emp-contact {
          font-size: 13px;
          color: #475569;
        }
        .emp-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }
        .emp-btn-edit, .emp-btn-menu {
          background: none;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .emp-btn-edit:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #2563eb;
        }
        .emp-btn-menu:hover {
          background: #f8fafc;
        }

        /* ── Dropdown ── */
        .emp-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 4px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          min-width: 160px;
          z-index: 20;
          overflow: hidden;
        }
        .emp-dropdown button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 14px;
          border: none;
          background: none;
          font-size: 13px;
          color: #334155;
          cursor: pointer;
          text-align: left;
        }
        .emp-dropdown button:hover {
          background: #f8fafc;
        }
        .emp-dropdown-danger {
          color: #dc2626 !important;
        }
        .emp-dropdown-danger:hover {
          background: #fef2f2 !important;
        }

        /* ── Modal ── */
        .emp-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: empFadeIn 0.15s ease;
        }
        @keyframes empFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .emp-modal {
          background: white;
          border-radius: 12px;
          width: 520px;
          max-width: 95vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
          animation: empSlideUp 0.2s ease;
        }
        .emp-modal-sm {
          width: 420px;
        }
        @keyframes empSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .emp-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
        }
        .emp-modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        .emp-modal-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
        }
        .emp-modal-close:hover {
          background: #f1f5f9;
          color: #475569;
        }
        .emp-modal-body {
          padding: 24px;
        }
        .emp-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .emp-field span {
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }
        .emp-field input, .emp-field select {
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #1e293b;
          background: white;
          transition: border-color 0.15s;
        }
        .emp-field input:focus, .emp-field select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .emp-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .emp-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #f1f5f9;
        }
        .emp-btn-cancel {
          padding: 10px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: #475569;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .emp-btn-cancel:hover {
          background: #f8fafc;
        }
        .emp-btn-danger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: #dc2626;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .emp-btn-danger:hover {
          background: #b91c1c;
        }
      `}</style>
    </div>
  );
}
