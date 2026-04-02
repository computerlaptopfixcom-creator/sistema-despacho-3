import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Package, FileSearch, ScrollText, BookOpenCheck, Scale, Coins, User } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import type { Service } from '../types';

const CATEGORIES: Service['categoria'][] = ['Pensiones', 'Fiscal', 'General'];

export default function Catalogo() {
  const { db, addService, updateService, deleteService } = useGlobalState();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('Todas');

  const [form, setForm] = useState({
    nombre: '',
    categoria: 'General' as Service['categoria'],
    descripcion: '',
    precioBase: '',
    duracion: '60 min',
    atiende: '',
  });

  const filtered = filterCat === 'Todas'
    ? db.services
    : db.services.filter(s => s.categoria === filterCat);

  const resetForm = () => {
    setForm({ nombre: '', categoria: 'General', descripcion: '', precioBase: '', duracion: '60 min', atiende: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.nombre.trim() || !form.precioBase) return;
    const precio = parseFloat(form.precioBase);
    if (isNaN(precio) || precio < 0) return;

    if (editingId) {
      updateService(editingId, {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        descripcion: form.descripcion.trim(),
        precioBase: precio,
        duracion: form.duracion.trim(),
        atiende: form.atiende.trim(),
      });
    } else {
      const service: Service = {
        id: crypto.randomUUID(),
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        descripcion: form.descripcion.trim(),
        precioBase: precio,
        duracion: form.duracion.trim(),
        atiende: form.atiende.trim(),
        activo: true,
      };
      addService(service);
    }
    resetForm();
  };

  const startEdit = (s: Service) => {
    setForm({
      nombre: s.nombre,
      categoria: s.categoria,
      descripcion: s.descripcion,
      precioBase: s.precioBase.toString(),
      duracion: s.duracion || '60 min',
      atiende: s.atiende || '',
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este servicio del catálogo?')) {
      deleteService(id);
    }
  };

  const toggleActive = (s: Service) => {
    updateService(s.id, { activo: !s.activo });
  };

  const formatMoney = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const getCatBadge = (cat: string) => {
    const map: Record<string, string> = {
      'Pensiones': 'badge-blue',
      'Fiscal': 'badge-purple',
      'General': 'badge-amber',
    };
    return map[cat] || 'badge-blue';
  };

  const getServiceIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    let Icon = Package;
    if (n.includes('fiscal')) Icon = FileSearch;
    else if (n.includes('pensiones')) Icon = ScrollText;
    else if (n.includes('contable')) Icon = BookOpenCheck;
    else if (n.includes('legal') || n.includes('civil')) Icon = Scale;
    else if (n.includes('financiero')) Icon = Coins;

    return (
      <div style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
        <Icon size={18} strokeWidth={1.5} />
        <div style={{ position: 'absolute', bottom: 0, right: -2, width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', border: '2px solid white' }} />
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Catálogo de Servicios</h1>
          <p className="subtitle">{db.services.length} servicios registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={18} /> Nuevo Servicio
        </button>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['Todas', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`btn btn-sm ${filterCat === cat ? 'btn-primary' : 'btn-outline'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Table */}
      <div className="card">
        {filtered.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Categoría</th>
                  <th>Atiende</th>
                  <th>Descripción</th>
                  <th>Precio Base</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} style={{ opacity: s.activo ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {getServiceIcon(s.nombre)}
                        <span style={{ fontSize: '0.95rem' }}>{s.nombre}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${getCatBadge(s.categoria)}`}>{s.categoria}</span></td>
                    <td className="text-secondary">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {(() => {
                           if (!s.atiende) return '—';
                           
                           const atiendeIds = s.atiende.split(/[,/]/).map(x => x.trim());
                           let matchedUsers = atiendeIds.map(idOrName => db.users.find(u => u.id === idOrName || u.nombre.toLowerCase().includes(idOrName.toLowerCase()))).filter(Boolean);
                           
                           if (matchedUsers.length === 0) return <span>{s.atiende}</span>;

                           matchedUsers = Array.from(new Set(matchedUsers));

                           if (matchedUsers.length === 1) {
                             const u = matchedUsers[0];
                             return (
                               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                 <div title={u!.nombre} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={14} />
                                 </div>
                                 <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{u!.nombre}</span>
                               </div>
                             );
                           }

                           return (
                             <div style={{ display: 'flex', alignItems: 'center' }}>
                               {matchedUsers.map((u, i) => (
                                  <div key={i} title={u!.nombre} style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid white', background: 'var(--accent-blue-light)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -12 : 0, zIndex: 10 - i }}>
                                    <User size={14} />
                                  </div>
                               ))}
                             </div>
                           );
                        })()}
                      </div>
                    </td>
                    <td className="text-secondary text-sm" style={{ maxWidth: 250 }}>{s.descripcion || '—'}</td>
                    <td style={{ fontWeight: 700, fontSize: '1rem' }}>{formatMoney(s.precioBase)}</td>
                    <td className="text-secondary">{s.duracion || '60 min'}</td>
                    <td>
                      <button
                         onClick={() => toggleActive(s)}
                         className={`badge ${s.activo ? 'badge-green' : 'badge-red'}`}
                         style={{ cursor: 'pointer', border: 'none' }}
                      >
                         {s.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => startEdit(s)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => handleDelete(s.id)} style={{ color: 'var(--accent-red)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No hay servicios en esta categoría.
          </div>
        )}
      </div>

      {/* New/Edit Service Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
            <div className="form-group">
              <label>Nombre del servicio *</label>
              <input
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Diagnóstico de Pensión"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label>¿Quién atiende este servicio? (Opcional, elige múltiples)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-input)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', maxHeight: 150, overflowY: 'auto' }}>
                {db.users.filter(u => u.rol === 'contador' || u.rol === 'admin').map(u => {
                  const selectedIds = form.atiende ? form.atiende.split(',') : [];
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, padding: '4px 0' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        style={{ width: '18px', height: '18px', margin: 0, cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
                        onChange={(e) => {
                          let newIds = [...selectedIds];
                          if (e.target.checked) newIds.push(u.id);
                          else newIds = newIds.filter(id => id !== u.id);
                          setForm(p => ({ ...p, atiende: newIds.join(',') }));
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={16} style={{ color: 'var(--accent-blue)' }}/> 
                        <span style={{ fontWeight: 500 }}>{u.nombre}</span>
                      </div>
                    </label>
                  );
                })}
                {db.users.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay usuarios (contadores) registrados. Añádelos en la pestaña Empleados.</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría *</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm(p => ({ ...p, categoria: e.target.value as Service['categoria'] }))}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Precio base (MXN) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={form.precioBase}
                  onChange={e => setForm(p => ({ ...p, precioBase: e.target.value }))}
                  placeholder="Ej: 1500"
                />
              </div>
              <div className="form-group">
                <label>Duración</label>
                <input
                  value={form.duracion}
                  onChange={e => setForm(p => ({ ...p, duracion: e.target.value }))}
                  placeholder="Ej: 60 min, 2 hrs..."
                />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción (opcional)</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Breve descripción del servicio..."
                style={{ minHeight: 70 }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={resetForm}>
                <X size={16} /> Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!form.nombre.trim() || !form.precioBase}
              >
                <Save size={16} /> {editingId ? 'Guardar Cambios' : 'Crear Servicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
