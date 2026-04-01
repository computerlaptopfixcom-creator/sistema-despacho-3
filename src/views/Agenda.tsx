import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Clock, Phone, User, ChevronLeft, ChevronRight, Trash2, Check, X } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import type { Appointment, AppointmentStatus } from '../types';

export default function Agenda() {
  const { db, addAppointment, updateAppointment, deleteAppointment } = useGlobalState();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [showNewAppt, setShowNewAppt] = useState(false);
  const [apptNombre, setApptNombre] = useState('');
  const [apptTelefono, setApptTelefono] = useState('');
  const [apptFecha, setApptFecha] = useState(currentDate);
  const [apptHora, setApptHora] = useState('10:00');
  const [apptMotivo, setApptMotivo] = useState('');

  // Get week dates from currentDate
  const weekDates = useMemo(() => {
    const date = new Date(currentDate + 'T12:00:00');
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [currentDate]);

  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const appointmentsThisWeek = useMemo(() => {
    return db.appointments
      .filter(a => a.fecha >= weekStart && a.fecha <= weekEnd)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
  }, [db.appointments, weekStart, weekEnd]);

  const goToPrevWeek = () => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setCurrentDate(new Date().toISOString().split('T')[0]);
  };

  const handleCreateAppointment = () => {
    if (!apptNombre.trim() || !apptTelefono.trim()) return;

    // Try to find existing client
    const existingClient = db.clients.find(
      c => c.telefono === apptTelefono.trim() || c.nombre.toLowerCase() === apptNombre.trim().toLowerCase()
    );

    const appointment: Appointment = {
      id: crypto.randomUUID(),
      clienteId: existingClient?.id,
      clienteNombre: apptNombre.trim(),
      clienteTelefono: apptTelefono.trim(),
      fecha: apptFecha,
      hora: apptHora,
      motivo: apptMotivo.trim() || 'Consulta general',
      estado: 'Programada',
    };

    addAppointment(appointment);
    setApptNombre('');
    setApptTelefono('');
    setApptMotivo('');
    setShowNewAppt(false);
  };

  const handleStatusChange = (id: string, estado: AppointmentStatus) => {
    updateAppointment(id, { estado });
  };

  const formatWeekDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'short' }).toUpperCase();
  };

  const formatDayNum = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDate().toString();
  };

  const formatMonth = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  const today = new Date().toISOString().split('T')[0];

  const statusConfig: Record<AppointmentStatus, { color: string; badge: string }> = {
    'Programada': { color: 'var(--accent-blue)', badge: 'badge-blue' },
    'Confirmada': { color: 'var(--accent-purple)', badge: 'badge-purple' },
    'Completada': { color: 'var(--accent-green)', badge: 'badge-green' },
    'Cancelada': { color: 'var(--accent-red)', badge: 'badge-red' },
    'No asistió': { color: 'var(--accent-amber)', badge: 'badge-amber' },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Agenda de Citas</h1>
          <p className="subtitle">{formatMonth(currentDate)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={goToToday}>Hoy</button>
          <button className="btn btn-outline btn-sm" onClick={goToPrevWeek}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-outline btn-sm" onClick={goToNextWeek}>
            <ChevronRight size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => { setApptFecha(currentDate); setShowNewAppt(true); }}>
            <CalendarPlus size={16} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* Week View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 24 }}>
        {weekDates.map(dateStr => {
          const isToday = dateStr === today;
          const dayAppts = appointmentsThisWeek.filter(a => a.fecha === dateStr);

          return (
            <div
              key={dateStr}
              style={{
                background: isToday ? 'var(--accent-blue-light)' : 'var(--bg-card)',
                border: isToday ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                minHeight: 140,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onClick={() => { setApptFecha(dateStr); setCurrentDate(dateStr); }}
            >
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isToday ? 'var(--accent-blue)' : 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  {formatWeekDay(dateStr)}
                </div>
                <div style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: isToday ? 'var(--accent-blue)' : 'var(--text-primary)',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  background: isToday ? 'var(--accent-blue)' : 'transparent',
                  ...(isToday ? { color: '#fff' } : {}),
                }}>
                  {formatDayNum(dateStr)}
                </div>
              </div>

              {dayAppts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayAppts.map(a => (
                    <div
                      key={a.id}
                      style={{
                        background: statusConfig[a.estado].color + '15',
                        borderLeft: `3px solid ${statusConfig[a.estado].color}`,
                        padding: '4px 6px',
                        borderRadius: '0 4px 4px 0',
                        fontSize: '0.7rem',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{a.hora}</div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.clienteNombre}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted" style={{ fontSize: '0.7rem', textAlign: 'center' }}>
                  Sin citas
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day Detail */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '0.95rem' }}>
            <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Citas del {new Date(currentDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h3>
          <button className="btn btn-sm btn-primary" onClick={() => { setApptFecha(currentDate); setShowNewAppt(true); }}>
            <CalendarPlus size={14} /> Agregar
          </button>
        </div>

        {(() => {
          const dayAppts = db.appointments
            .filter(a => a.fecha === currentDate)
            .sort((a, b) => a.hora.localeCompare(b.hora));

          if (dayAppts.length === 0) {
            return (
              <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 24 }}>
                No hay citas programadas para este día.
              </p>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dayAppts.map(a => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 16px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `4px solid ${statusConfig[a.estado].color}`,
                  }}
                >
                  <div style={{ minWidth: 50, textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>{a.hora}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.clienteNombre}</span>
                      <span className={`badge ${statusConfig[a.estado].badge}`} style={{ fontSize: '0.65rem' }}>
                        {a.estado}
                      </span>
                    </div>
                    <div className="text-muted text-sm" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span><Phone size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {a.clienteTelefono}</span>
                      <span>{a.motivo}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {a.estado === 'Programada' && (
                      <>
                        <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(a.id, 'Confirmada')} title="Confirmar" style={{ padding: '4px 8px' }}>
                          <Check size={14} />
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(a.id, 'Cancelada')} title="Cancelar" style={{ padding: '4px 8px', color: 'var(--accent-red)' }}>
                          <X size={14} />
                        </button>
                      </>
                    )}
                    {a.estado === 'Confirmada' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(a.id, 'Completada')} style={{ padding: '4px 8px' }}>
                        <Check size={14} /> Completada
                      </button>
                    )}
                    {a.clienteId && (
                      <button className="btn btn-sm btn-outline" onClick={() => navigate(`/clientes/${a.clienteId}`)} style={{ padding: '4px 8px' }}>
                        <User size={14} />
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline" onClick={() => deleteAppointment(a.id)} title="Eliminar" style={{ padding: '4px 8px', color: 'var(--accent-red)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* New Appointment Modal */}
      {showNewAppt && (
        <div className="modal-overlay" onClick={() => setShowNewAppt(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Nueva Cita</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del cliente *</label>
                <input
                  value={apptNombre}
                  onChange={e => setApptNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Teléfono *</label>
                <input
                  value={apptTelefono}
                  onChange={e => setApptTelefono(e.target.value)}
                  placeholder="Ej: 656 123 4567"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fecha *</label>
                <input type="date" value={apptFecha} onChange={e => setApptFecha(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Hora *</label>
                <input type="time" value={apptHora} onChange={e => setApptHora(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Motivo</label>
              <input
                value={apptMotivo}
                onChange={e => setApptMotivo(e.target.value)}
                placeholder="Ej: Diagnóstico de pensión, consulta fiscal..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowNewAppt(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateAppointment}
                disabled={!apptNombre.trim() || !apptTelefono.trim()}
              >
                <CalendarPlus size={16} /> Agendar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
