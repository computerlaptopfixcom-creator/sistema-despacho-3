import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Package } from 'lucide-react';
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                        {s.nombre}
                      </div>
                    </td>
                    <td><span className={`badge ${getCatBadge(s.categoria)}`}>{s.categoria}</span></td>
                    <td className="text-secondary">{s.atiende || '—'}</td>
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
              <label>¿Quién atiende este servicio?</label>
              <input
                value={form.atiende}
                onChange={e => setForm(p => ({ ...p, atiende: e.target.value }))}
                placeholder="Ej: Gerardo Huerta / Christian Huerta"
              />
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
