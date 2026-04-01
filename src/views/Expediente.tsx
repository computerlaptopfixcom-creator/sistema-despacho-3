import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Phone, Edit2, Save, X, Trash2 } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';

export default function Expediente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, updateClient, deleteClient, addVisit } = useGlobalState();

  const client = db.clients.find(c => c.id === id);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCurp, setEditCurp] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const visits = useMemo(() => {
    if (!id) return [];
    return db.visits
      .filter(v => v.clienteId === id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
  }, [db.visits, id]);

  if (!client) {
    return (
      <div>
        <button className="btn btn-outline mb-4" onClick={() => navigate('/clientes')}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="text-muted">Cliente no encontrado.</p>
        </div>
      </div>
    );
  }

  const startEdit = () => {
    setEditName(client.nombre);
    setEditPhone(client.telefono);
    setEditCurp(client.curp || '');
    setEditNotes(client.notasGenerales || '');
    setEditing(true);
  };

  const saveEdit = () => {
    if (!editName.trim() || !editPhone.trim()) return;
    updateClient(client.id, {
      nombre: editName.trim(),
      telefono: editPhone.trim(),
      curp: editCurp.trim() || undefined,
      notasGenerales: editNotes.trim() || undefined,
    });
    setEditing(false);
  };

  const handleNewVisit = () => {
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

  const handleDelete = () => {
    deleteClient(client.id);
    navigate('/clientes');
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <button className="btn btn-outline mb-4" onClick={() => navigate('/clientes')}>
        <ArrowLeft size={16} /> Volver a Clientes
      </button>

      {/* Client Header */}
      <div className="card mb-4">
        <div className="page-header" style={{ marginBottom: editing ? 16 : 0 }}>
          <div>
            {!editing ? (
              <>
                <h1>{client.nombre}</h1>
                <p className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} /> {client.telefono}
                  {client.curp && <span style={{ marginLeft: 12 }}>CURP: {client.curp}</span>}
                </p>
              </>
            ) : (
              <h1>Editando datos</h1>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!editing ? (
              <>
                <button className="btn btn-outline btn-sm" onClick={startEdit}>
                  <Edit2 size={14} /> Editar
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
                  <Trash2 size={14} />
                </button>
                <button className="btn btn-primary" onClick={handleNewVisit}>
                  <PlusCircle size={18} /> Nueva Atención
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                  <X size={14} /> Cancelar
                </button>
                <button className="btn btn-success btn-sm" onClick={saveEdit}>
                  <Save size={14} /> Guardar
                </button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <div>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Teléfono *</label>
                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>CURP (opcional)</label>
              <input value={editCurp} onChange={e => setEditCurp(e.target.value)} placeholder="Ej: LOHE800101MCHPRR09" />
            </div>
            <div className="form-group">
              <label>Notas generales (opcional)</label>
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Observaciones generales del cliente..." />
            </div>
          </div>
        )}

        {!editing && client.notasGenerales && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-sm text-secondary" style={{ fontWeight: 600 }}>Notas: </span>
            <span className="text-sm">{client.notasGenerales}</span>
          </div>
        )}
      </div>

      {/* Visit History */}
      <div className="card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.1rem' }}>Historial de Atenciones ({visits.length})</h2>
        </div>

        {visits.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Notas</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.id}>
                    <td>{formatDate(v.fecha)}</td>
                    <td>{v.hora}</td>
                    <td><span className={`badge ${getStatusBadge(v.estado)}`}>{v.estado}</span></td>
                    <td className="text-secondary text-sm" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.notas || '—'}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => navigate(`/visita/${v.id}`)}>
                        {v.estado === 'Finalizada' ? 'Ver' : 'Continuar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            No hay atenciones registradas para este cliente.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>⚠️ Eliminar Cliente</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              ¿Estás seguro de que deseas eliminar a <strong>{client.nombre}</strong>?
            </p>
            <p className="text-sm text-muted">
              Se eliminarán también todas sus {visits.length} atenciones registradas. Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowDelete(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
