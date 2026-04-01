import { useState, useEffect } from 'react';
import { CalendarCheck, Phone, User, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const OFFICE_HOURS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const MOTIVOS = [
  'Diagnóstico de Pensión',
  'Trámite de Pensión IMSS',
  'Corrección de Semanas Cotizadas',
  'Declaración Anual',
  'Constancia de Situación Fiscal',
  'Alta en el SAT',
  'Consultoría General',
  'Otro',
];

type BookedSlot = { fecha: string; hora: string };

export default function AgendarPublico() {
  const [step, setStep] = useState(1);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [booked, setBooked] = useState<BookedSlot[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Get available dates (next 2 weeks, Mon-Fri)
  const getWeekDates = () => {
    const dates: string[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const day = d.getDay();
      if (day >= 1 && day <= 5) {
        const iso = d.toISOString().split('T')[0];
        if (iso >= today.toISOString().split('T')[0]) {
          dates.push(iso);
        }
      }
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Load booked slots for visible week
  useEffect(() => {
    if (weekDates.length === 0) return;
    fetch('/api/appointments')
      .then(r => r.json())
      .then((appts: any[]) => {
        setBooked(
          appts
            .filter(a => a.estado !== 'Cancelada')
            .map(a => ({ fecha: a.fecha, hora: a.hora }))
        );
      })
      .catch(() => { });
  }, [weekOffset]);

  const isSlotTaken = (fecha: string, hora: string) =>
    booked.some(b => b.fecha === fecha && b.hora === hora);

  const isToday = (dateStr: string) =>
    dateStr === new Date().toISOString().split('T')[0];

  const isPastSlot = (dateStr: string, hora: string) => {
    if (!isToday(dateStr)) return false;
    const now = new Date();
    const [h, m] = hora.split(':').map(Number);
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
  };

  const formatDay = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return {
      weekday: date.toLocaleDateString('es-MX', { weekday: 'short' }).toUpperCase(),
      day: date.getDate(),
      month: date.toLocaleDateString('es-MX', { month: 'short' }),
    };
  };

  const handleSubmit = async () => {
    if (!nombre.trim() || !telefono.trim() || !selectedDate || !selectedHora) return;
    setSending(true);
    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          clienteNombre: nombre.trim(),
          clienteTelefono: telefono.trim(),
          clienteEmail: email.trim(),
          fecha: selectedDate,
          hora: selectedHora,
          motivo: motivo || 'Consulta general',
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

  // Success screen
  if (done) {
    return (
      <div className="pub-page">
        <div className="pub-card pub-success">
          <div className="pub-success-icon">
            <Check size={48} />
          </div>
          <h2>¡Cita Agendada!</h2>
          <p>Su cita ha sido registrada exitosamente.</p>
          <div className="pub-summary">
            <div><strong>Nombre:</strong> {nombre}</div>
            <div><strong>Teléfono:</strong> {telefono}</div>
            <div><strong>Correo:</strong> {email || 'No proporcionado'}</div>
            <div><strong>Fecha:</strong> {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div><strong>Hora:</strong> {selectedHora}</div>
            <div><strong>Motivo:</strong> {motivo || 'Consulta general'}</div>
          </div>
          <p className="pub-muted">Le contactaremos por teléfono para confirmar su cita.</p>
          <button className="pub-btn pub-btn-primary" onClick={() => { setDone(false); setStep(1); setNombre(''); setTelefono(''); setEmail(''); setMotivo(''); setSelectedDate(''); setSelectedHora(''); }}>
            Agendar otra cita
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pub-page">
      <div className="pub-header">
        <h1>Despacho Fiscal 2087</h1>
        <p>Agende su cita de forma rápida y sencilla</p>
      </div>

      {/* Progress */}
      <div className="pub-progress">
        {[1, 2, 3].map(s => (
          <div key={s} className={`pub-progress-step ${step >= s ? 'active' : ''}`}>
            <div className="pub-progress-dot">{step > s ? <Check size={14} /> : s}</div>
            <span>{s === 1 ? 'Datos' : s === 2 ? 'Fecha' : 'Confirmar'}</span>
          </div>
        ))}
      </div>

      <div className="pub-card">

        {/* Step 1: Personal Data */}
        {step === 1 && (
          <>
            <h2><User size={20} /> Sus datos</h2>
            <div className="pub-form-group">
              <label>Nombre completo *</label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez López"
                autoFocus
              />
            </div>
            <div className="pub-form-group">
              <label>Teléfono *</label>
              <input
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="Ej: 656 123 4567"
                type="tel"
              />
            </div>
            <div className="pub-form-group">
              <label>Correo electrónico *</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ej: juan.perez@email.com"
                type="email"
              />
            </div>
            <div className="pub-form-group">
              <label>¿Qué servicio necesita?</label>
              <select value={motivo} onChange={e => setMotivo(e.target.value)}>
                <option value="">Seleccione un motivo...</option>
                {MOTIVOS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <button
              className="pub-btn pub-btn-primary pub-btn-full"
              disabled={!nombre.trim() || !telefono.trim() || !email.trim()}
              onClick={() => setStep(2)}
            >
              Siguiente →
            </button>
          </>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <>
            <h2><Clock size={20} /> Seleccione fecha y hora</h2>

            {/* Week Nav */}
            <div className="pub-week-nav">
              <button className="pub-btn pub-btn-sm" onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={weekOffset === 0}>
                <ChevronLeft size={16} />
              </button>
              <span className="pub-week-label">
                {weekDates.length > 0 ? new Date(weekDates[0] + 'T12:00:00').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) : ''}
              </span>
              <button className="pub-btn pub-btn-sm" onClick={() => setWeekOffset(Math.min(3, weekOffset + 1))} disabled={weekOffset >= 3}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Date Picker */}
            <div className="pub-dates">
              {weekDates.map(d => {
                const { weekday, day, month } = formatDay(d);
                const isSelected = d === selectedDate;

                return (
                  <button
                    key={d}
                    className={`pub-date-btn ${isSelected ? 'selected' : ''} ${isToday(d) ? 'today' : ''}`}
                    onClick={() => { setSelectedDate(d); setSelectedHora(''); }}
                  >
                    <span className="pub-date-weekday">{weekday}</span>
                    <span className="pub-date-day">{day}</span>
                    <span className="pub-date-month">{month}</span>
                  </button>
                );
              })}
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="pub-times">
                <h3>Horarios disponibles</h3>
                <div className="pub-time-grid">
                  {OFFICE_HOURS.map(hora => {
                    const taken = isSlotTaken(selectedDate, hora);
                    const past = isPastSlot(selectedDate, hora);
                    const disabled = taken || past;
                    const isSelected = hora === selectedHora;

                    return (
                      <button
                        key={hora}
                        className={`pub-time-btn ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                        onClick={() => !disabled && setSelectedHora(hora)}
                        disabled={disabled}
                      >
                        {hora}
                        {taken && <span className="pub-time-tag">Ocupado</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pub-btn-row">
              <button className="pub-btn pub-btn-outline" onClick={() => setStep(1)}>← Atrás</button>
              <button
                className="pub-btn pub-btn-primary"
                disabled={!selectedDate || !selectedHora}
                onClick={() => setStep(3)}
              >
                Siguiente →
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <>
            <h2><CalendarCheck size={20} /> Confirme su cita</h2>
            <div className="pub-summary">
              <div className="pub-summary-row">
                <User size={16} />
                <div>
                  <strong>{nombre}</strong>
                  <span>{telefono}</span>
                </div>
              </div>
              <div className="pub-summary-row">
                <Clock size={16} />
                <div>
                  <strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                  <span>{selectedHora} hrs</span>
                </div>
              </div>
              <div className="pub-summary-row">
                <Phone size={16} />
                <div>
                  <strong>Motivo</strong>
                  <span>{motivo || 'Consulta general'}</span>
                </div>
              </div>
            </div>

            <div className="pub-btn-row">
              <button className="pub-btn pub-btn-outline" onClick={() => setStep(2)}>← Atrás</button>
              <button
                className="pub-btn pub-btn-primary pub-btn-lg"
                onClick={handleSubmit}
                disabled={sending}
              >
                {sending ? 'Agendando...' : '✓ Confirmar Cita'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="pub-footer">
        <p>Despacho Fiscal 2087 — Atención presencial con cita</p>
        <p>Horario: Lunes a Viernes, 9:00 - 18:00</p>
      </div>
    </div>
  );
}
