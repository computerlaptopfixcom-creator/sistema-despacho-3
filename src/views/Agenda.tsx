import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Calendar, List, ChevronLeft, ChevronRight, Search, Plus, Filter, Download, User, RefreshCw, XCircle, X, CheckCircle } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';
import type { Appointment, AppointmentStatus } from '../types';

export default function Agenda() {
  const { db, addAppointment, updateAppointment, currentUser } = useGlobalState();
  const navigate = useNavigate();
  const isContador = currentUser?.rol === 'contador';

  const [activeTab, setActiveTab] = useState<'calendario' | 'lista'>('lista');

  // --- CALENDAR STATE ---
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const currentMonthDate = new Date(currentDate + 'T12:00:00');

  // --- LIST STATE ---
  const [searchTerm, setSearchTerm] = useState('');

  // --- NEW APPOINTMENT MODAL ---
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [apptNombre, setApptNombre] = useState('');
  const [apptTelefono, setApptTelefono] = useState('');
  const [apptFecha, setApptFecha] = useState(currentDate);
  const [apptHora, setApptHora] = useState('10:00');
  const [apptMotivo, setApptMotivo] = useState('');

  // --- RESCHEDULE MODAL ---
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [reschedFecha, setReschedFecha] = useState('');
  const [reschedHora, setReschedHora] = useState('');

  const OFFICE_HOURS = ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

  const openReschedule = (appt: Appointment) => {
    setRescheduleAppt(appt);
    setReschedFecha(appt.fecha);
    setReschedHora(appt.hora);
  };

  const handleReschedule = () => {
    if (!rescheduleAppt || !reschedFecha || !reschedHora) return;
    updateAppointment(rescheduleAppt.id, { fecha: reschedFecha, hora: reschedHora } as any);
    setRescheduleAppt(null);
  };

  const handleCancel = (appt: Appointment) => {
    if (confirm(`¿Cancelar la cita de ${appt.clienteNombre}?`)) {
      updateAppointment(appt.id, { estado: 'Cancelada' as AppointmentStatus });
    }
  };

  // Get appointments filtered by Role
  const authorizedAppointments = useMemo(() => {
    let appts = db.appointments;
    if (isContador && currentUser?.id) {
      appts = appts.filter(a => a.assigned_to === currentUser.id);
    }
    return appts.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
  }, [db.appointments, isContador, currentUser]);

  // --- CALENDAR LOGIC ---
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startOffset = firstDay.getDay() - 1; 
    if (startOffset < 0) startOffset = 6; // Make Monday = 0

    const days = [];
    // Padding empty cells
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    // Days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      // pad month and day
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(i).padStart(2, '0');
      days.push(`${year}-${mm}-${dd}`);
    }
    return days;
  }, [currentMonthDate]);

  const goToPrevMonth = () => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const goToNextMonth = () => {
    const d = new Date(currentDate + 'T12:00:00');
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setCurrentDate(new Date().toISOString().split('T')[0]);
  };

  const statusConfig: Record<AppointmentStatus, { color: string; badge: string }> = {
    'Aprobada': { color: '#10b981', badge: 'badge-green' },       // green — default for new bookings
    'Programada': { color: '#3b82f6', badge: 'badge-blue' },     // blue
    'Confirmada': { color: '#8b5cf6', badge: 'badge-purple' },   // purple
    'Completada': { color: '#10b981', badge: 'badge-green' },    // green
    'Cancelada': { color: '#ef4444', badge: 'badge-red' },       // red
    'No asistió': { color: '#f59e0b', badge: 'badge-amber' },    // amber
  };

  // --- ACTIONS ---
  const handleCreateAppointment = () => {
    if (!apptNombre.trim() || !apptTelefono.trim()) return;
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
      estado: 'Aprobada',
      assigned_to: currentUser?.id, // Auto-assign to self for now if accountant, or null
    };

    addAppointment(appointment);
    setApptNombre(''); setApptTelefono(''); setApptMotivo('');
    setShowNewAppt(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 24, paddingBottom: 20 }}>
      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{activeTab === 'calendario' ? 'Calendario' : 'Agenda'}</h1>
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: 4, borderRadius: 'var(--radius-lg)' }}>
            <button
              onClick={() => setActiveTab('calendario')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 'var(--radius-md)',
                background: activeTab === 'calendario' ? 'var(--bg-card)' : 'transparent',
                boxShadow: activeTab === 'calendario' ? 'var(--shadow-sm)' : 'none',
                color: activeTab === 'calendario' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'calendario' ? 600 : 500,
                fontSize: '0.9rem'
              }}
            ><Calendar size={16} /> Calendario</button>
            <button
              onClick={() => setActiveTab('lista')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 'var(--radius-md)',
                background: activeTab === 'lista' ? 'var(--bg-card)' : 'transparent',
                boxShadow: activeTab === 'lista' ? 'var(--shadow-sm)' : 'none',
                color: activeTab === 'lista' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'lista' ? 600 : 500,
                fontSize: '0.9rem'
              }}
            ><List size={16} /> Reservas</button>
          </div>
        </div>
        
        {/* RIGHT CONTROLS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {activeTab === 'calendario' ? (
            <>
              <button className="btn btn-outline btn-sm" onClick={goToToday} style={{ borderRadius: 20, padding: '8px 16px' }}>Hoy</button>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button className="btn btn-outline btn-sm" onClick={goToPrevMonth} style={{ padding: '8px', border: 'none' }}><ChevronLeft size={20} color="var(--text-muted)"/></button>
                <button className="btn btn-outline btn-sm" onClick={goToNextMonth} style={{ padding: '8px', border: 'none' }}><ChevronRight size={20} color="var(--text-muted)" /></button>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, minWidth: 'auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {currentMonthDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </div>
              <select className="input" style={{ padding: '8px 16px', height: 38, width: 100, borderRadius: 8 }}>
                <option>Mes</option>
              </select>
            </>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: 220 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Buscar reservas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-input)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button className="btn btn-outline btn-sm" style={{ borderRadius: 8 }}><Filter size={16} /></button>
              <button className="btn btn-outline btn-sm" style={{ borderRadius: 8 }}><Download size={16} /></button>
            </div>
          )}
          {!isContador && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewAppt(true)} style={{ borderRadius: 8, whiteSpace: 'nowrap' }}>
              <Plus size={16} /> {activeTab === 'calendario' ? 'Añadir' : 'Reservar cita'}
            </button>
          )}
        </div>
      </div>

      {/* ─── VISTA CALENDARIO ─── */}
      {activeTab === 'calendario' && (
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => (
              <div key={d} style={{ padding: '16px 12px', textAlign: 'center', fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, 1fr)', flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
            {calendarDays.map((dayIso, index) => {
              if (!dayIso) {
                // Empty padding cell with diagonal pattern representation (simplified with slight opacity/bg)
                return <div key={`empty-${index}`} style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', opacity: 0.6 }} />;
              }
              const isToday = dayIso === new Date().toISOString().split('T')[0];
              const dayAppts = authorizedAppointments.filter(a => a.fecha === dayIso);
              const dayNum = parseInt(dayIso.split('-')[2], 10);

              return (
                <div key={dayIso} style={{ borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.80rem', fontWeight: isToday ? 700 : 600,
                    background: isToday ? 'var(--accent-purple)' : 'transparent',
                    color: isToday ? '#fff' : 'var(--text-secondary)',
                    marginBottom: 4
                  }}>
                    {dayNum}
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {dayAppts.slice(0, 4).map(a => (
                      <div key={a.id} style={{ fontSize: '0.70rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', cursor: 'pointer', padding: '2px 0' }} title={`${a.hora} - ${a.clienteNombre}`}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusConfig[a.estado]?.color || '#3b82f6', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{a.hora}</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>{a.motivo}</span>
                      </div>
                    ))}
                    {dayAppts.length > 4 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 600, marginTop: 2 }}>
                        + {dayAppts.length - 4} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── VISTA LISTA (RESERVAS) ─── */}
      {activeTab === 'lista' && (
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ padding: '16px 24px', display:'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Citas programadas</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({authorizedAppointments.length} reservas)</span>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table className="table" style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '16px 24px', width: 40 }}><input type="checkbox" /></th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Hora</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Servicio</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Empleado</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {authorizedAppointments.filter(a => a.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())).map(a => {
                  const empName = a.assigned_to 
                    ? db.users.find(u => u.id === a.assigned_to)?.nombre 
                    : (a.motivo.toLowerCase().includes('contable') ? 'Christian Huerta' : 'Gerardo Huerta');
                    
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', background: 'var(--bg-card)', opacity: a.estado === 'Cancelada' ? 0.5 : 1 }}>
                      <td style={{ padding: '16px 24px' }}><input type="checkbox" /></td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.id.substring(0,3)}</td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-MX', {day:'2-digit', month:'2-digit', year:'numeric'})}</td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.hora}</td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: a.estado === 'Cancelada' ? 'line-through' : 'none' }}>{a.clienteNombre.toUpperCase()}</td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.motivo}</td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                          border: `1px solid ${statusConfig[a.estado]?.color || '#ccc'}40`,
                          background: `${statusConfig[a.estado]?.color || '#ccc'}10`,
                          color: statusConfig[a.estado]?.color || '#333'
                        }}>
                          {a.estado}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent-blue-light)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-blue)' }}>
                            <User size={14} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{empName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {a.estado !== 'Cancelada' && a.estado !== 'Completada' && (
                            <>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => openReschedule(a)}
                                title="Reagendar"
                                style={{ borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--accent-blue)' }}
                              >
                                <RefreshCw size={13} /> Reagendar
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleCancel(a)}
                                title="Cancelar"
                                style={{ borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--accent-red)' }}
                              >
                                <XCircle size={13} /> Cancelar
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => updateAppointment(a.id, { estado: 'Completada' as AppointmentStatus })}
                                title="Marcar como finalizada"
                                style={{ borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--accent-green)' }}
                              >
                                <CheckCircle size={13} /> Finalizada
                              </button>
                            </>
                          )}
                          {a.estado === 'Cancelada' && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Cancelada</span>
                          )}
                          {a.estado === 'Completada' && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 600 }}>✓ Finalizada</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL NUEVA CITA ─── */}
      {showNewAppt && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 32, borderRadius: 20 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 24, fontWeight: 700 }}>Nueva Cita</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del Cliente</label>
                <input type="text" className="input" value={apptNombre} onChange={e => setApptNombre(e.target.value)} style={{ background: 'var(--bg-input)', border: 'none' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Teléfono</label>
                <input type="tel" className="input" value={apptTelefono} onChange={e => setApptTelefono(e.target.value)} style={{ background: 'var(--bg-input)', border: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha</label>
                  <input type="date" className="input" value={apptFecha} onChange={e => setApptFecha(e.target.value)} style={{ background: 'var(--bg-input)', border: 'none' }} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Hora</label>
                  <input type="time" className="input" value={apptHora} onChange={e => setApptHora(e.target.value)} style={{ background: 'var(--bg-input)', border: 'none' }} />
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Servicio / Motivo</label>
                <input type="text" className="input" value={apptMotivo} onChange={e => setApptMotivo(e.target.value)} placeholder="Ej. Consulta en pensiones" style={{ background: 'var(--bg-input)', border: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button className="btn btn-outline" onClick={() => setShowNewAppt(false)} style={{ borderRadius: 8 }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleCreateAppointment} style={{ borderRadius: 8 }}>Guardar Cita</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL REAGENDAR ─── */}
      {rescheduleAppt && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: 32, borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>🔄 Reagendar Cita</h2>
              <button className="btn btn-sm btn-outline" onClick={() => setRescheduleAppt(null)} style={{ border: 'none', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Cliente</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{rescheduleAppt.clienteNombre}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Servicio</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{rescheduleAppt.motivo}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nueva Fecha</label>
                <input type="date" className="input" value={reschedFecha} onChange={e => setReschedFecha(e.target.value)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nuevo Horario</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {OFFICE_HOURS.map(h => (
                    <button
                      key={h}
                      onClick={() => setReschedHora(h)}
                      style={{
                        padding: '10px 0', borderRadius: 8, border: '1px solid var(--border-color)',
                        background: reschedHora === h ? 'var(--accent-blue)' : 'var(--bg-input)',
                        color: reschedHora === h ? '#fff' : 'var(--text-secondary)',
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-outline" onClick={() => setRescheduleAppt(null)} style={{ borderRadius: 8 }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleReschedule} disabled={!reschedFecha || !reschedHora} style={{ borderRadius: 8 }}>
                  <RefreshCw size={16} /> Reagendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
