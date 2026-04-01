import { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Phone, Edit2, Save, X, Trash2, FileText, Upload, Download, FileArchive } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';

interface Document {
  id: string;
  client_id: string;
  filename: string;
  original_name: string;
  filepath: string;
  upload_date: string;
  size: number;
}

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

  // Tabs
  const [activeTab, setActiveTab] = useState<'datos' | 'visitas' | 'documentos'>('datos');

  // Documents State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Documents
  useEffect(() => {
    if (activeTab === 'documentos' && id) {
      setLoadingDocs(true);
      fetch(`/api/documents/client/${id}`)
        .then(res => res.json())
        .then(data => setDocuments(data || []))
        .catch(console.error)
        .finally(() => setLoadingDocs(false));
    }
  }, [activeTab, id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('clientId', id);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocuments(prev => [newDoc, ...prev]);
      }
    } catch (err) {
      console.error('Error uploading document:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este escaneo?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error('Error deleting doc:', err);
    }
  };

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
      documentosRecibidos: [],
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
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div>
      <button className="btn btn-outline mb-4" onClick={() => navigate('/clientes')}>
        <ArrowLeft size={16} /> Volver a Clientes
      </button>

      {/* Header Expediente */}
      <div className="card mb-4" style={{ paddingBottom: 0 }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h1>{client.nombre}</h1>
            <p className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={14} /> {client.telefono}
              <span className="text-muted" style={{ marginLeft: 8 }}>| Expediente #{client.id.split('-')[0].toUpperCase()}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
              <Trash2 size={14} />
            </button>
            <button className="btn btn-primary" onClick={handleNewVisit}>
              <PlusCircle size={18} /> Nueva Atención
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border-color)', marginTop: 24 }}>
          {['datos', 'visitas', 'documentos'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid var(--accent-blue)' : '3px solid transparent',
                color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab ? 600 : 500,
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab === 'visitas' ? `Atenciones (${visits.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* TABS CONTENT */}
      
      {activeTab === 'datos' && (
        <div className="card" style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Información Personal</h2>
            {!editing ? (
              <button className="btn btn-outline btn-sm" onClick={startEdit}>
                <Edit2 size={14} /> Editar
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
                <button className="btn btn-success btn-sm" onClick={saveEdit}><Save size={14} /> Guardar</button>
              </div>
            )}
          </div>

          {!editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div>
                <p className="text-secondary text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>CURP</p>
                <p>{client.curp || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-secondary text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>Fecha de Alta</p>
                <p>{formatDate(client.fechaAlta || '')}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p className="text-secondary text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>Notas Generales</p>
                <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                  {client.notasGenerales || 'Sin observaciones.'}
                </div>
              </div>
            </div>
          ) : (
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
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Observaciones generales del cliente..." rows={4} />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'visitas' && (
        <div className="card" style={{ animation: 'slideUp 0.3s ease' }}>
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
      )}

      {activeTab === 'documentos' && (
        <div className="card" style={{ animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.1rem' }}>Caja de Escaneos</h2>
              <p className="text-sm text-secondary">Documentos, identificaciones y archivos del expediente administrativo.</p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                accept="image/*,.pdf"
              />
              <button 
                className="btn btn-primary" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <span className="spinner" style={{width: 14, height: 14, borderWidth: 2}}/> : <Upload size={16} />}
                {uploading ? ' Subiendo...' : ' Subir Escaneo'}
              </button>
            </div>
          </div>

          {loadingDocs ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : documents.length > 0 ? (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {documents.map((doc, idx) => (
                <div key={doc.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px 20px', 
                  borderBottom: idx === documents.length - 1 ? 'none' : '1px solid var(--border-color)',
                  background: 'var(--bg-card)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ padding: 10, background: 'var(--bg-input)', borderRadius: 10, color: 'var(--accent-blue)' }}>
                      {doc.original_name.endsWith('.pdf') ? <FileText size={20} /> : <FileArchive size={20} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2 }}>{doc.original_name}</p>
                      <p className="text-secondary text-sm">
                        Subido: {formatDate(doc.upload_date)} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={doc.filepath} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                      <Download size={14} /> Ver
                    </a>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDocument(doc.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <Upload size={32} style={{ opacity: 0.5, marginBottom: 12, margin: '0 auto' }} />
              <p style={{ fontWeight: 600 }}>El expediente está vacío</p>
              <p className="text-sm">Aprieta "Subir Escaneo" para agregar el primer documento.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>⚠️ Eliminar Cliente</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              ¿Estás seguro de que deseas eliminar a <strong>{client.nombre}</strong>?
            </p>
            <p className="text-sm text-muted">
              Se eliminarán también todas sus {visits.length} atenciones registradas y archivos escaneados. Esta acción no se puede deshacer.
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
