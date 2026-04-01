import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileCheck, FileX, User, CheckCircle2, Circle, Plus, Trash2, Banknote, Receipt, FileDown, Printer } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import type { VisitStatus, VisitService, Payment } from '../types';
import { generateReceipt, generateVisitSummary } from '../utils/receipts';

const STATUS_OPTIONS: { value: VisitStatus; label: string; color: string }[] = [
  { value: 'Abierta', label: 'Abierta', color: 'var(--accent-blue)' },
  { value: 'En Proceso', label: 'En Proceso', color: 'var(--accent-purple)' },
  { value: 'Pendiente', label: 'Pendiente', color: 'var(--accent-amber)' },
  { value: 'Finalizada', label: 'Finalizada', color: 'var(--accent-green)' },
];

export default function Visita() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, updateVisit, addPayment } = useGlobalState();

  const visit = db.visits.find(v => v.id === id);
  const client = visit ? db.clients.find(c => c.id === visit.clienteId) : null;
  const activeServices = db.services.filter(s => s.activo);

  const [notas, setNotas] = useState('');
  const [docsFaltantes, setDocsFaltantes] = useState('');
  const [atendidoPor, setAtendidoPor] = useState('');
  const [estado, setEstado] = useState<VisitStatus>('Abierta');
  const [docs, setDocs] = useState<{ nombre: string; recibido: boolean }[]>([]);
  const [servicios, setServicios] = useState<VisitService[]>([]);
  const [saved, setSaved] = useState(false);

  // Payment modal state
  const [showPayment, setShowPayment] = useState(false);
  const [payMonto, setPayMonto] = useState('');
  const [payMetodo, setPayMetodo] = useState<Payment['metodo']>('Efectivo');
  const [payNotas, setPayNotas] = useState('');

  const visitPayments = useMemo(() => {
    if (!id) return [];
    return db.payments.filter(p => p.visitaId === id);
  }, [db.payments, id]);

  useEffect(() => {
    if (visit) {
      setNotas(visit.notas);
      setDocsFaltantes(visit.documentosFaltantes);
      setAtendidoPor(visit.atendidoPor);
      setEstado(visit.estado);
      setDocs([...visit.documentosRecibidos]);
      setServicios(visit.servicios || []);
    }
  }, [visit?.id]);

  const totalServicios = useMemo(() => servicios.reduce((sum, s) => sum + s.subtotal, 0), [servicios]);
  const totalPagado = useMemo(() => visitPayments.reduce((sum, p) => sum + p.monto, 0), [visitPayments]);
  const saldoPendiente = totalServicios - totalPagado;

  if (!visit) {
    return (
      <div>
        <button className="btn btn-outline mb-4" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="text-muted">Visita no encontrada.</p>
        </div>
      </div>
    );
  }

  const toggleDoc = (index: number) => {
    setDocs(prev => prev.map((d, i) => (i === index ? { ...d, recibido: !d.recibido } : d)));
  };

  const handleSave = () => {
    updateVisit(visit.id, {
      notas,
      documentosFaltantes: docsFaltantes,
      atendidoPor,
      estado,
      documentosRecibidos: docs,
      servicios,
      totalServicios,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleStatusChange = (newStatus: VisitStatus) => {
    setEstado(newStatus);
    updateVisit(visit.id, { estado: newStatus });
  };

  const addServiceToVisit = (serviceId: string) => {
    const svc = db.services.find(s => s.id === serviceId);
    if (!svc) return;
    // Check if already added
    if (servicios.some(s => s.serviceId === serviceId)) return;
    setServicios(prev => [...prev, {
      serviceId: svc.id,
      nombre: svc.nombre,
      precioUnitario: svc.precioBase,
      cantidad: 1,
      subtotal: svc.precioBase,
    }]);
  };

  const updateServiceQty = (serviceId: string, qty: number) => {
    if (qty < 1) return;
    setServicios(prev => prev.map(s =>
      s.serviceId === serviceId
        ? { ...s, cantidad: qty, subtotal: s.precioUnitario * qty }
        : s
    ));
  };

  const removeServiceFromVisit = (serviceId: string) => {
    setServicios(prev => prev.filter(s => s.serviceId !== serviceId));
  };

  const handleRegisterPayment = () => {
    const monto = parseFloat(payMonto);
    if (isNaN(monto) || monto <= 0) return;
    if (!visit || !client) return;
    const payment: Payment = {
      id: crypto.randomUUID(),
      visitaId: visit.id,
      clienteId: client.id,
      monto,
      fecha: new Date().toISOString(),
      metodo: payMetodo,
      folio: `PAY-${Date.now().toString(36).toUpperCase()}`,
      notas: payNotas.trim() || undefined,
    };
    addPayment(payment);
    setPayMonto('');
    setPayNotas('');
    setShowPayment(false);
  };

  const formatMoney = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatDateTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (e: string) => {
    const map: Record<string, string> = {
      'Abierta': 'badge-blue',
      'En Proceso': 'badge-purple',
      'Pendiente': 'badge-amber',
      'Finalizada': 'badge-green',
    };
    return map[e] || 'badge-blue';
  };

  const availableToAdd = activeServices.filter(s => !servicios.some(vs => vs.serviceId === s.id));

  const handlePrintReceipt = (payment: Payment) => {
    if (!client) return;
    generateReceipt({
      clienteNombre: client.nombre,
      clienteTelefono: client.telefono,
      visitaFecha: visit.fecha,
      visitaHora: visit.hora,
      servicios,
      totalServicios,
      payment,
      totalPagado,
      saldoPendiente,
    });
  };

  const handlePrintSummary = () => {
    if (!client) return;
    generateVisitSummary({
      clienteNombre: client.nombre,
      clienteTelefono: client.telefono,
      visitaFecha: visit.fecha,
      visitaHora: visit.hora,
      estado,
      servicios,
      totalServicios,
      payments: visitPayments,
      totalPagado,
      saldoPendiente,
      notas,
      atendidoPor,
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button className="btn btn-outline" onClick={() => client ? navigate(`/clientes/${client.id}`) : navigate('/')}>
          <ArrowLeft size={16} /> {client ? 'Volver al Expediente' : 'Volver'}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={handlePrintSummary} title="Descargar resumen PDF">
            <FileDown size={16} /> Resumen PDF
          </button>
          <button className="btn btn-success" onClick={handleSave}>
            <Save size={16} /> {saved ? '✓ Guardado' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Visit Header */}
      <div className="card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <User size={18} style={{ color: 'var(--accent-blue)' }} />
              <h2 style={{ fontSize: '1.2rem' }}>{client?.nombre || 'Cliente desconocido'}</h2>
            </div>
            <p className="text-secondary text-sm">
              {formatDate(visit.fecha)} a las {visit.hora}
            </p>
          </div>
          <div>
            <span className={`badge ${getStatusBadge(estado)}`} style={{ fontSize: '0.85rem', padding: '6px 16px' }}>
              {estado}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status Control */}
          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '0.95rem' }}>Estado de la Atención</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: estado === opt.value ? `2px solid ${opt.color}` : '2px solid var(--border-color)',
                    background: estado === opt.value ? `${opt.color}11` : 'var(--bg-card)',
                    color: estado === opt.value ? opt.color : 'var(--text-secondary)',
                    fontWeight: estado === opt.value ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '0.95rem' }}>Notas de la Atención</h3>
            <div className="form-group">
              <label>Atendido por</label>
              <input
                value={atendidoPor}
                onChange={e => setAtendidoPor(e.target.value)}
                placeholder="Nombre del asesor"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Notas / Bitácora</label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Descripción del caso, hallazgos, decisiones tomadas..."
                style={{ minHeight: 120 }}
              />
            </div>
          </div>

          {/* Services Selection */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.95rem' }}>Servicios</h3>
            </div>

            {/* Add service dropdown */}
            {availableToAdd.length > 0 && (
              <div className="form-group">
                <select
                  defaultValue=""
                  onChange={e => { addServiceToVisit(e.target.value); e.target.value = ''; }}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="" disabled>+ Agregar servicio...</option>
                  {availableToAdd.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} — {formatMoney(s.precioBase)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected services */}
            {servicios.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {servicios.map(s => (
                  <div
                    key={s.serviceId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.nombre}</div>
                      <div className="text-muted text-sm">{formatMoney(s.precioUnitario)} c/u</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        min="1"
                        value={s.cantidad}
                        onChange={e => updateServiceQty(s.serviceId, parseInt(e.target.value) || 1)}
                        style={{ width: 60, textAlign: 'center', padding: '6px 8px' }}
                      />
                      <span style={{ fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                        {formatMoney(s.subtotal)}
                      </span>
                      <button
                        onClick={() => removeServiceFromVisit(s.serviceId)}
                        style={{ background: 'none', color: 'var(--accent-red)', padding: 4 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 14px',
                  background: 'var(--accent-blue-light)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'var(--accent-blue)',
                }}>
                  <span>Total Servicios</span>
                  <span>{formatMoney(totalServicios)}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 16 }}>
                No se han agregado servicios a esta atención.
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Document Checklist */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.95rem' }}>Documentos</h3>
              <span className="text-sm text-muted">
                <FileCheck size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {docs.filter(d => d.recibido).length}/{docs.length} recibidos
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {docs.map((doc, i) => (
                <button
                  key={i}
                  onClick={() => toggleDoc(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: doc.recibido ? 'var(--accent-green-light)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    color: doc.recibido ? 'var(--accent-green)' : 'var(--text-primary)',
                    fontWeight: doc.recibido ? 600 : 400,
                  }}
                >
                  {doc.recibido ? <CheckCircle2 size={18} /> : <Circle size={18} style={{ color: 'var(--text-muted)' }} />}
                  {doc.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Missing Documents */}
          <div className="card">
            <h3 style={{ marginBottom: 12, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileX size={16} style={{ color: 'var(--accent-red)' }} />
              Documentos Faltantes / Pendientes
            </h3>
            <textarea
              value={docsFaltantes}
              onChange={e => setDocsFaltantes(e.target.value)}
              placeholder="Ej: Falta traer constancia de semanas original..."
              style={{ minHeight: 80 }}
            />
          </div>

          {/* Payment Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Banknote size={16} style={{ color: 'var(--accent-green)' }} />
                Pagos
              </h3>
              <button className="btn btn-sm btn-primary" onClick={() => setShowPayment(true)}>
                <Plus size={14} /> Registrar Pago
              </button>
            </div>

            {/* Payment summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              marginBottom: visitPayments.length > 0 ? 12 : 0,
            }}>
              <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div className="text-muted text-sm">Total</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatMoney(totalServicios)}</div>
              </div>
              <div style={{ background: 'var(--accent-green-light)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ color: 'var(--accent-green)', fontSize: '0.78rem', fontWeight: 600 }}>Pagado</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-green)' }}>{formatMoney(totalPagado)}</div>
              </div>
              <div style={{
                background: saldoPendiente > 0 ? 'var(--accent-red-light)' : 'var(--accent-green-light)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
              }}>
                <div style={{ color: saldoPendiente > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: '0.78rem', fontWeight: 600 }}>Saldo</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: saldoPendiente > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                  {formatMoney(saldoPendiente)}
                </div>
              </div>
            </div>

            {/* Payment history */}
            {visitPayments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visitPayments.map(p => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{formatMoney(p.monto)}</span>
                      <span className="text-muted" style={{ marginLeft: 8 }}>{p.metodo}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="text-muted text-sm">
                        <Receipt size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        {p.folio} · {formatDateTime(p.fecha)}
                      </span>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handlePrintReceipt(p)}
                        title="Imprimir recibo"
                        style={{ padding: '4px 8px' }}
                      >
                        <Printer size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Registrar Pago</h2>
            {saldoPendiente > 0 && (
              <div style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.9rem', fontWeight: 600 }}>
                Saldo pendiente: {formatMoney(saldoPendiente)}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Monto (MXN) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={payMonto}
                  onChange={e => setPayMonto(e.target.value)}
                  placeholder={saldoPendiente > 0 ? saldoPendiente.toString() : '0'}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Método de pago *</label>
                <select value={payMetodo} onChange={e => setPayMetodo(e.target.value as Payment['metodo'])}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Notas (opcional)</label>
              <input
                value={payNotas}
                onChange={e => setPayNotas(e.target.value)}
                placeholder="Ej: Anticipo, pago parcial..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowPayment(false)}>Cancelar</button>
              <button
                className="btn btn-success"
                onClick={handleRegisterPayment}
                disabled={!payMonto || parseFloat(payMonto) <= 0}
              >
                <Banknote size={16} /> Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
