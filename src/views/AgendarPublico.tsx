import { useState, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight, CalendarDays, Clock, UserCircle, ClipboardCheck, Wallet } from 'lucide-react';

type BookedSlot = { fecha: string; hora: string };
type ServiceData = { id: string; nombre: string; precioBase: number; duracion: string; atiende: string; activo: boolean };

const OFFICE_HOURS = [
  '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
];

const STEPS = [
  { key: 'servicio', label: 'Selección del servicio', shortLabel: 'Servicio', icon: ClipboardCheck },
  { key: 'fecha', label: 'Fecha y Hora', shortLabel: 'Fecha', icon: CalendarDays },
  { key: 'datos', label: 'Tu Información', shortLabel: 'Info', icon: UserCircle },
  { key: 'pagos', label: 'Pagos', shortLabel: 'Pagos', icon: Wallet },
];

export default function AgendarPublico() {
  const [step, setStep] = useState(0);
  // Step 1: Service
  const [services, setServices] = useState<ServiceData[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [atiendeSeleccionado, setAtiendeSeleccionado] = useState('');
  // Step 2: Date/Time
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [booked, setBooked] = useState<BookedSlot[]>([]);
  // Step 3: Personal
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  // Step 4: Payment
  const [metodoPago, setMetodoPago] = useState('');
  // State
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [employees, setEmployees] = useState<{id:string; nombre:string; rol:string}[]>([]);

  const selectedService = services.find(s => s.id === selectedServiceId) || null;
  const getEmployeeName = (id: string) => {
    if (!id || id === 'Por asignar') return 'Por asignar';
    return employees.find(e => e.id === id)?.nombre || "Asesor Asignado";
  };
  const atiendeOptions = selectedService?.atiende
    ? selectedService.atiende.split(/[\/,]/).map(a => a.trim()).filter(Boolean)
    : [];

  // Load services and employees
  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then((data: ServiceData[]) => setServices(data.filter(s => s.activo)))
      .catch(() => {});
      
    fetch('/api/users')
      .then(r => r.json())
      .then(data => setEmployees(data.filter((u:any) => u.rol !== 'cliente')))
      .catch(() => {});
  }, []);

  // Auto-select employee if only one is available for the service
  useEffect(() => {
    if (atiendeOptions.length === 1 && !atiendeSeleccionado) {
      setAtiendeSeleccionado(atiendeOptions[0]);
    }
  }, [atiendeOptions, atiendeSeleccionado]);

  // Load booked slots
  useEffect(() => {
    fetch('/api/appointments')
      .then(r => r.json())
      .then((appts: any[]) => {
        setBooked(appts.filter(a => a.estado !== 'Cancelada').map(a => ({ fecha: a.fecha, hora: a.hora })));
      })
      .catch(() => {});
  }, []);

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Mon=0
  const todayStr = new Date().toISOString().split('T')[0];

  const calDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const makeIso = (day: number) => {
    const m = String(calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${calYear}-${m}-${d}`;
  };

  const isDayPast = (day: number) => makeIso(day) < todayStr;
  const isDayWeekend = (day: number) => {
    const dow = new Date(calYear, calMonth, day).getDay();
    return dow === 0 || dow === 6;
  };

  const isSlotTaken = (fecha: string, hora: string) => booked.some(b => b.fecha === fecha && b.hora === hora);

  const isPastSlot = (fecha: string, hora: string) => {
    if (fecha !== todayStr) return false;
    const now = new Date();
    const [h] = hora.split(':').map(Number);
    return now.getHours() >= h;
  };

  const formatHourRange = (hora: string) => {
    const [h] = hora.split(':').map(Number);
    const fmtH = (n: number) => {
      if (n === 0 || n === 24) return '12:00 a. m.';
      if (n === 12) return '12:00 p. m.';
      return n < 12 ? `${n}:00 a. m.` : `${n - 12}:00 p. m.`;
    };
    return `${fmtH(h)} - ${fmtH(h + 1)}`;
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const canNext = (s: number) => {
    if (s === 0) return !!selectedServiceId && (atiendeOptions.length <= 1 || !!atiendeSeleccionado);
    if (s === 1) return !!selectedDate && !!selectedHora;
    if (s === 2) return !!nombre.trim() && !!apellido.trim() && !!telefono.trim() && !!email.trim();
    if (s === 3) return !!metodoPago;
    return false;
  };

  const handleSubmit = async () => {
    setSending(true);
    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          clienteNombre: `${nombre.trim()} ${apellido.trim()}`,
          clienteTelefono: telefono.trim(),
          clienteEmail: email.trim(),
          atiendeSeleccionado: atiendeSeleccionado || (atiendeOptions.length === 1 ? atiendeOptions[0] : ''),
          fecha: selectedDate,
          hora: selectedHora,
          motivo: selectedService?.nombre || 'Consulta general',
          metodoPago,
          estado: 'Programada',
        }),
      });
      setDone(true);
    } catch {
      alert('Error al agendar. Intente de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setStep(0); setSelectedServiceId(''); setAtiendeSeleccionado('');
    setSelectedDate(''); setSelectedHora('');
    setNombre(''); setApellido(''); setTelefono(''); setEmail('');
    setMetodoPago('');
    setDone(false);
  };

  /* ─── Sidebar Summary ─── */
  const sidebarSummary = () => {
    const items: { label: string; sub?: string }[] = [];
    if (step > 0 && selectedService) {
      items.push({ label: selectedService.nombre, sub: atiendeSeleccionado || (atiendeOptions.length === 1 ? atiendeOptions[0] : undefined) });
    }
    if (step > 1 && selectedDate) {
      const d = new Date(selectedDate + 'T12:00:00');
      items.push({ label: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }), sub: formatHourRange(selectedHora) });
    }
    return items;
  };

  /* ─── ICS Calendar Download ─── */
  const downloadICS = () => {
    const [h] = selectedHora.split(':').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');
    const [y, m, d] = selectedDate.split('-');
    const dtStart = `${y}${m}${d}T${pad(h)}0000`;
    const dtEnd = `${y}${m}${d}T${pad(h + 1)}0000`;
    const asesor = getEmployeeName(atiendeSeleccionado || (atiendeOptions.length === 1 ? atiendeOptions[0] : ''));
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Despacho Fiscal 2087//Cita//ES',
      'BEGIN:VEVENT',
      `DTSTART;TZID=America/Chicago:${dtStart}`,
      `DTEND;TZID=America/Chicago:${dtEnd}`,
      `SUMMARY:Cita - ${selectedService?.nombre || 'Consulta'} | Despacho Fiscal 2087`,
      `LOCATION:C. Toronja Roja 6275\\, Ampliación Aeropuerto\\, 32698 Juárez\\, Chih.`,
      `DESCRIPTION:Asesor: ${asesor}\\nPago: ${metodoPago}\\nTeléfono: +52 656 533 4271`,
      'STATUS:CONFIRMED',
      `ORGANIZER;CN=Despacho Fiscal 2087:mailto:info@despachofiscal2087.com.mx`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cita-despacho-fiscal-2087.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── RENDER ─── */

  if (done) {
    return (
      <div className="bk-page">
        <div className="bk-wrapper">
          <aside className="bk-sidebar">
            <div className="bk-sidebar-brand">Despacho Fiscal 2087</div>
            {STEPS.map((s, i) => (
              <div key={s.key} className="bk-step completed">
                <div className="bk-step-dot"><Check size={14} /></div>
                <div className="bk-step-info">
                  <span className="bk-step-label">{s.label}</span>
                </div>
              </div>
            ))}
            <div className="bk-sidebar-footer">
              <div className="bk-sidebar-contact">Contacto</div>
              <div>+52 656 533 4271</div>
              <div>info@despachofiscal2087.com.mx</div>
            </div>
          </aside>
          <main className="bk-main">
            <div className="bk-success">
              <div className="bk-success-icon">🎉</div>
              <h2>¡Enhorabuena!</h2>
              <p className="bk-success-sub">Su cita ha sido registrada exitosamente</p>
              <div className="bk-ticket">
                <div className="bk-ticket-row"><span>Fecha:</span><strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></div>
                <div className="bk-ticket-row"><span>Hora:</span><strong>{formatHourRange(selectedHora)}</strong></div>
                <div className="bk-ticket-row"><span>Servicio:</span><strong>{selectedService?.nombre}</strong></div>
                  <div className="bk-ticket-row"><span>Asesor:</span><strong>{getEmployeeName(atiendeSeleccionado || (atiendeOptions.length === 1 ? atiendeOptions[0] : 'Por asignar'))}</strong></div>
                <div className="bk-ticket-row"><span>Precio:</span><strong>{Number(selectedService?.precioBase || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong></div>
                <div className="bk-ticket-row"><span>Pago:</span><strong>{metodoPago === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}</strong></div>
                <hr />
                <div className="bk-ticket-row"><span>Tu nombre:</span><strong>{nombre} {apellido}</strong></div>
                <div className="bk-ticket-row"><span>Correo:</span><strong>{email}</strong></div>
                <div className="bk-ticket-row"><span>Teléfono:</span><strong>+52 {telefono}</strong></div>
              </div>

              <div className="bk-location-box">
                <div className="bk-location-title">📍 Dirección de la cita</div>
                <a
                  href="https://maps.app.goo.gl/FPoV7PznL3yDsEyS9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bk-location-link"
                >
                  C. Toronja Roja 6275, Ampliación Aeropuerto, 32698 Juárez, Chih.
                </a>
                <div className="bk-location-phone">📞 +52 656 533 4271</div>
              </div>

              <p className="bk-success-msg">Le contactaremos para confirmar su cita.</p>
              <div className="bk-success-actions">
                <button className="bk-btn bk-btn-secondary" onClick={downloadICS}>📅 Agregar al calendario</button>
                <button className="bk-btn bk-btn-primary" onClick={reset}>Terminar</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-page">
      <div className="bk-wrapper">
        {/* Sidebar */}
        <aside className="bk-sidebar">
          <div className="bk-sidebar-brand">Despacho Fiscal 2087</div>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const completed = i < step;
            const active = i === step;
            const summaryItems = sidebarSummary();
            return (
              <div key={s.key} className={`bk-step ${completed ? 'completed' : ''} ${active ? 'active' : ''}`}>
                <div className="bk-step-dot">
                  {completed ? <Check size={14} /> : <Icon size={16} />}
                </div>
                <div className="bk-step-info">
                  <span className="bk-step-label">{s.label}</span>
                  {completed && i === 0 && summaryItems[0] && (
                    <div className="bk-step-summary">
                      <div>{summaryItems[0].label}</div>
                      {summaryItems[0].sub && <div>{summaryItems[0].sub}</div>}
                    </div>
                  )}
                  {completed && i === 1 && summaryItems[1] && (
                    <div className="bk-step-summary">
                      <div>{summaryItems[1].label} - {summaryItems[1].sub}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Mobile Progress Bar ── */}
          <div className="bk-mobile-progress">
            {STEPS.map((s, i) => {
              const completed = i < step;
              const active = i === step;
              return (
                <div key={`m-${s.key}`} style={{ display: 'contents' }}>
                  <div className={`bk-mobile-step ${completed ? 'completed' : ''} ${active ? 'active' : ''}`}>
                    <div className="bk-mobile-dot">
                      {completed ? <Check size={14} /> : i + 1}
                    </div>
                    <span className="bk-mobile-step-label">{s.shortLabel}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`bk-mobile-line ${i < step ? 'done' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="bk-sidebar-footer">
            <div className="bk-sidebar-contact">Contacto</div>
            <div>+52 656 533 4271</div>
            <div>info@despachofiscal2087.com.mx</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="bk-main">
          {/* Back arrow + title */}
          <div className="bk-main-header">
            {step > 0 && (
              <button className="bk-back" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={20} />
              </button>
            )}
            <h2>{STEPS[step].label}</h2>
          </div>

          {/* ══ Step 0: Servicio ══ */}
          {step === 0 && (
            <div className="bk-content">
              <div className="bk-field">
                <label>* Servicio:</label>
                <select
                  value={selectedServiceId}
                  onChange={e => { setSelectedServiceId(e.target.value); setAtiendeSeleccionado(''); }}
                >
                  <option value="">Selecciona el servicio</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              {selectedService && (
                <div className="bk-service-info">
                  <span>⏱ {selectedService.duracion || '60 min'}</span>
                  <span>💰 {Number(selectedService.precioBase).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                </div>
              )}

              {atiendeOptions.length > 0 && (
                <div className="bk-field" style={{ marginTop: 24 }}>
                  <label>{atiendeOptions.length > 1 ? 'Asesor:' : 'Asesor asignado:'}</label>
                  <div className="bk-employee-list">
                    {atiendeOptions.map(a => {
                      const name = getEmployeeName(a);
                      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      const isSelected = atiendeSeleccionado === a;
                      return (
                        <div 
                          key={a} 
                          className={`bk-employee-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setAtiendeSeleccionado(a)}
                        >
                          <div className="bk-avatar">{initials}</div>
                          <div className="bk-employee-info">
                            <span className="bk-employee-name">{name}</span>
                            <span className="bk-employee-badge">Especialista</span>
                          </div>
                          <div className="bk-employee-check">
                            <Check size={14} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ Step 1: Fecha y Hora ══ */}
          {step === 1 && (
            <div className="bk-content">
              {/* Month nav */}
              <div className="bk-cal-nav">
                <select value={calMonth} onChange={e => setCalMonth(Number(e.target.value))}>
                  {monthNames.map((m, i) => <option key={i} value={i}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
                <select value={calYear} onChange={e => setCalYear(Number(e.target.value))}>
                  {[2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="bk-cal-arrows">
                  <button onClick={prevMonth}><ChevronLeft size={16} /></button>
                  <button onClick={nextMonth}><ChevronRight size={16} /></button>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="bk-cal-grid">
                {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(d => (
                  <div key={d} className="bk-cal-head">{d}</div>
                ))}
                {calDays.map((day, i) => {
                  if (day === null) return <div key={`e${i}`} className="bk-cal-cell empty" />;
                  const iso = makeIso(day);
                  const past = isDayPast(day);
                  const weekend = isDayWeekend(day);
                  const disabled = past || weekend;
                  const selected = iso === selectedDate;
                  const isToday = iso === todayStr;
                  return (
                    <button
                      key={day}
                      className={`bk-cal-cell ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${isToday ? 'today' : ''} ${weekend ? 'weekend' : ''}`}
                      disabled={disabled}
                      onClick={() => { setSelectedDate(iso); setSelectedHora(''); }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="bk-timeslots">
                  <h4>🕐 Horarios disponibles — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                  <div className="bk-timeslot-grid">
                    {OFFICE_HOURS.map(hora => {
                      const taken = isSlotTaken(selectedDate, hora);
                      const past = isPastSlot(selectedDate, hora);
                      const disabled = taken || past;
                      const selected = hora === selectedHora;
                      return (
                        <button
                          key={hora}
                          className={`bk-timeslot ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                          disabled={disabled}
                          onClick={() => setSelectedHora(hora)}
                        >
                          {formatHourRange(hora)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ Step 2: Datos personales ══ */}
          {step === 2 && (
            <div className="bk-content">
              <div className="bk-field-row">
                <div className="bk-field">
                  <label>* Nombre:</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: David" autoFocus />
                </div>
                <div className="bk-field">
                  <label>* Apellido:</label>
                  <input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Ej: Hernández" />
                </div>
              </div>
              <div className="bk-field-row">
                <div className="bk-field">
                  <label>Correo electrónico:</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" type="email" />
                </div>
                <div className="bk-field">
                  <label>Teléfono:</label>
                  <div className="bk-phone-input">
                    <span className="bk-phone-prefix">🇲🇽 +52</span>
                    <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Introducir teléfono" type="tel" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ Step 3: Pagos ══ */}
          {step === 3 && (
            <div className="bk-content">
              {/* Resumen */}
              <h3 className="bk-section-title">Resumen</h3>
              <div className="bk-invoice-box">
                <div className="bk-invoice-header">Servicios</div>
                <div className="bk-invoice-row">
                  <span>{selectedService?.nombre} ({Number(selectedService?.precioBase || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}) x 1 persona</span>
                  <strong>{Number(selectedService?.precioBase || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong>
                </div>
              </div>
              <div className="bk-invoice-total">
                <span>Importe Total:</span>
                <strong className="bk-price">{Number(selectedService?.precioBase || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong>
              </div>

              {/* Forma de pago */}
              <h3 className="bk-section-title" style={{ marginTop: 28 }}>Forma de pago</h3>
              <div className="bk-payment-methods">
                <button
                  className={`bk-payment-card ${metodoPago === 'efectivo' ? 'selected' : ''}`}
                  onClick={() => setMetodoPago('efectivo')}
                >
                  <span className="bk-payment-icon">💵</span>
                  <span className="bk-payment-label">Efectivo</span>
                </button>
                <button
                  className={`bk-payment-card ${metodoPago === 'tarjeta' ? 'selected' : ''}`}
                  onClick={() => setMetodoPago('tarjeta')}
                >
                  <span className="bk-payment-icon">💳</span>
                  <span className="bk-payment-label">Tarjeta</span>
                </button>
              </div>
              {metodoPago && (
                <p className="bk-payment-note">
                  {metodoPago === 'efectivo'
                    ? 'El pago se realizará en efectivo al momento de su cita.'
                    : 'El pago se realizará con tarjeta al momento de su cita.'}
                </p>
              )}
            </div>
          )}

          {/* Footer with Continue */}
          <div className="bk-main-footer">
            {step < 3 ? (
              <button
                className="bk-btn bk-btn-primary"
                disabled={!canNext(step)}
                onClick={() => setStep(step + 1)}
              >
                Continuar
              </button>
            ) : (
              <button
                className="bk-btn bk-btn-primary bk-btn-confirm"
                disabled={sending}
                onClick={handleSubmit}
              >
                {sending ? 'Agendando...' : '✓ Agendar Cita'}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
