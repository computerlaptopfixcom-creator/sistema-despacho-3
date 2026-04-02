import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Calendar, List, ChevronLeft, ChevronRight, Search, Plus, Filter, Download, User } from 'lucide-react';
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
      estado: 'Programada',
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
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Calendario</h1>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <div className="search-bar" style={{ flex: 1, minWidth: 200, margin: 0, borderRadius: 8 }}>
                <Search size={16} />
                <input type="text" placeholder="Buscar reservas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%' }} />
              </div>
              <button className="btn btn-outline btn-sm" style={{ borderRadius: 8 }}><Filter size={16} /></button>
              <button className="btn btn-outline btn-sm" style={{ borderRadius: 8 }}><Download size={16} /></button>
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewAppt(true)} style={{ borderRadius: 8, whiteSpace: 'nowrap' }}>
            <Plus size={16} /> {activeTab === 'calendario' ? 'Añadir' : 'Reservar cita'}
          </button>
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
          <div style={{ display: 'flex', overflowX: 'auto', gap: 24, padding: '0 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <div style={{ padding: '20px 0', borderBottom: '2px solid var(--text-primary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Citas</div>
            <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Paquetes</div>
            <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Eventos</div>
          </div>
          
          <div style={{ padding: '16px 24px', display:'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Calendar size={14} /> abar 1, 2026 - abr 1, 2027
            </div>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table className="table" style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '16px 24px', width: 40 }}><input type="checkbox" /></th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Hora</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Servicio</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Tipo</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 600 }}>Empleado</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600 }}>Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {authorizedAppointments.filter(a => a.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase())).map(a => {
                  const empName = a.assigned_to 
                    ? db.users.find(u => u.id === a.assigned_to)?.nombre 
                    : (a.motivo.toLowerCase().includes('contable') ? 'Christian Huerta' : 'Gerardo Huerta');
                    
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', background: 'var(--bg-card)' }}>
                      <td style={{ padding: '16px 24px' }}><input type="checkbox" /></td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.id.substring(0,3)}</td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-MX', {day:'2-digit', month:'2-digit', year:'numeric'})}</td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.hora} a. m.</td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.clienteNombre.toUpperCase()}</td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.motivo}</td>
                      <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}><User size={14}/> Reserva individual</div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <select 
                          value={a.estado} 
                          onChange={(e) => updateAppointment(a.id, { estado: e.target.value as AppointmentStatus })}
                          style={{
                            padding: '6px 12px', borderRadius: '20px', border: `1px solid ${statusConfig[a.estado]?.color || '#ccc'}40`,
                            background: `${statusConfig[a.estado]?.color || '#ccc'}10`, color: statusConfig[a.estado]?.color || '#333',
                            fontSize: '0.75rem', fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='${(statusConfig[a.estado]?.color || '#333').replace('#', '%23')}' viewBox='0 0 24 24' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px'
                          }}
                        >
                          <option value="Aprobada" style={{ color: '#333' }}>✓ Aprobada</option>
                          <option value="Programada" style={{ color: '#333' }}>Programada</option>
                          <option value="Confirmada" style={{ color: '#333' }}>Confirmada</option>
                          <option value="Completada" style={{ color: '#333' }}>Completada</option>
                          <option value="Cancelada" style={{ color: '#333' }}>Cancelada</option>
                        </select>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent-blue-light)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-blue)' }}>
                            <User size={14} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{empName}</span>
                          <span style={{ fontSize: '0.65rem', background: 'var(--accent-blue)', color: 'white', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>Más populares</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Despacho Fiscal 2087</span>
                          <span style={{ cursor: 'pointer', fontWeight: 700, letterSpacing: '2px' }}>...</span>
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
    </div>
  );
}
