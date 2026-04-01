import { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, Users, CalendarCheck, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useGlobalState } from '../context/GlobalState';

export default function Reportes() {
  const { db } = useGlobalState();
  const [periodoFilter, setPeriodoFilter] = useState<'hoy' | 'semana' | 'mes' | 'todo'>('mes');
  const [showPendingDetail, setShowPendingDetail] = useState(false);

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const getDateRange = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    switch (periodoFilter) {
      case 'hoy':
        start.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'mes':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'todo':
        start.setFullYear(2020);
        break;
    }
    return { start, end };
  };

  const { start, end } = getDateRange();

  const filteredPayments = useMemo(() => {
    return db.payments.filter(p => {
      const d = new Date(p.fecha);
      return d >= start && d <= end;
    });
  }, [db.payments, start.getTime(), end.getTime()]);

  const filteredVisits = useMemo(() => {
    return db.visits.filter(v => {
      const d = new Date(v.fecha + 'T12:00:00');
      return d >= start && d <= end;
    });
  }, [db.visits, start.getTime(), end.getTime()]);

  // Financial summary
  const totalIngresos = filteredPayments.reduce((sum, p) => sum + p.monto, 0);
  const totalPorMetodo = filteredPayments.reduce((acc, p) => {
    acc[p.metodo] = (acc[p.metodo] || 0) + p.monto;
    return acc;
  }, {} as Record<string, number>);

  // Service analysis
  const serviceFrequency = useMemo(() => {
    const freq: Record<string, { nombre: string; count: number; total: number }> = {};
    filteredVisits.forEach(v => {
      (v.servicios || []).forEach((s: any) => {
        if (!freq[s.serviceId]) {
          freq[s.serviceId] = { nombre: s.nombre, count: 0, total: 0 };
        }
        freq[s.serviceId].count += s.cantidad;
        freq[s.serviceId].total += s.subtotal;
      });
    });
    return Object.values(freq).sort((a, b) => b.total - a.total);
  }, [filteredVisits]);

  // Pending balances
  const pendingVisits = useMemo(() => {
    return db.visits
      .filter(v => v.estado !== 'Finalizada')
      .map(v => {
        const client = db.clients.find(c => c.id === v.clienteId);
        const vPayments = db.payments.filter(p => p.visitaId === v.id);
        const totalServicios = (v.servicios || []).reduce((s: number, sv: any) => s + sv.subtotal, 0);
        const totalPagado = vPayments.reduce((s, p) => s + p.monto, 0);
        const saldo = totalServicios - totalPagado;
        return {
          ...v,
          clienteNombre: client?.nombre || 'Sin nombre',
          totalServicios,
          totalPagado,
          saldo,
        };
      })
      .filter(v => v.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo);
  }, [db.visits, db.clients, db.payments]);

  const totalPendiente = pendingVisits.reduce((sum, v) => sum + v.saldo, 0);

  // Visit stats
  const visitsByStatus = filteredVisits.reduce((acc, v) => {
    acc[v.estado] = (acc[v.estado] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatMoney = (n: number) =>
    n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  const periodoLabel: Record<string, string> = {
    hoy: 'Hoy',
    semana: 'Últimos 7 días',
    mes: 'Este mes',
    todo: 'Todo el historial',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reportes Financieros</h1>
          <p className="subtitle">Control de ingresos y cuentas por cobrar</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['hoy', 'semana', 'mes', 'todo'] as const).map(p => (
            <button
              key={p}
              className={`btn btn-sm ${periodoFilter === p ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPeriodoFilter(p)}
            >
              {periodoLabel[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--accent-green)', fontSize: '1.4rem' }}>{formatMoney(totalIngresos)}</div>
            <div className="stat-label">Ingresos cobrados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-red-light)', color: 'var(--accent-red)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--accent-red)', fontSize: '1.4rem' }}>{formatMoney(totalPendiente)}</div>
            <div className="stat-label">Saldo pendiente total</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
            <CalendarCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{filteredVisits.length}</div>
            <div className="stat-label">Atenciones en periodo</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-purple-light)', color: 'var(--accent-purple)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">{filteredPayments.length}</div>
            <div className="stat-label">Pagos registrados</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Payment Methods */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: '0.95rem' }}>
            <DollarSign size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: 'var(--accent-green)' }} />
            Ingresos por Método de Pago
          </h3>
          {Object.keys(totalPorMetodo).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(totalPorMetodo).map(([metodo, monto]) => {
                const pct = totalIngresos > 0 ? (monto / totalIngresos) * 100 : 0;
                return (
                  <div key={metodo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.88rem' }}>
                      <span style={{ fontWeight: 600 }}>{metodo}</span>
                      <span style={{ fontWeight: 700 }}>{formatMoney(monto)}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: metodo === 'Efectivo' ? 'var(--accent-green)' : metodo === 'Transferencia' ? 'var(--accent-blue)' : 'var(--accent-purple)',
                        borderRadius: 4,
                        transition: 'width 500ms ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 20 }}>
              Sin pagos en este periodo.
            </p>
          )}
        </div>

        {/* Status Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: '0.95rem' }}>
            <Clock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: 'var(--accent-blue)' }} />
            Atenciones por Estado
          </h3>
          {filteredVisits.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Abierta', 'En Proceso', 'Pendiente', 'Finalizada'].map(estado => {
                const count = visitsByStatus[estado] || 0;
                if (count === 0) return null;
                const pct = (count / filteredVisits.length) * 100;
                const colorMap: Record<string, string> = {
                  'Abierta': 'var(--accent-blue)',
                  'En Proceso': 'var(--accent-purple)',
                  'Pendiente': 'var(--accent-amber)',
                  'Finalizada': 'var(--accent-green)',
                };
                return (
                  <div key={estado}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.88rem' }}>
                      <span style={{ fontWeight: 600 }}>{estado}</span>
                      <span style={{ fontWeight: 700 }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: colorMap[estado],
                        borderRadius: 4,
                        transition: 'width 500ms ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 20 }}>
              Sin atenciones en este periodo.
            </p>
          )}
        </div>
      </div>

      {/* Top Services */}
      <div className="card mb-4">
        <h3 style={{ marginBottom: 16, fontSize: '0.95rem' }}>
          <TrendingUp size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: 'var(--accent-purple)' }} />
          Servicios Más Vendidos
        </h3>
        {serviceFrequency.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th style={{ textAlign: 'center' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Ingreso Total</th>
                </tr>
              </thead>
              <tbody>
                {serviceFrequency.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-blue">{s.count}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)' }}>
                      {formatMoney(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 20 }}>
           Sin servicios registrados en este periodo.
          </p>
        )}
      </div>

      {/* Pending Balances */}
      <div className="card">
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowPendingDetail(!showPendingDetail)}
        >
          <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
            Cuentas por Cobrar ({pendingVisits.length})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-red)' }}>
              {formatMoney(totalPendiente)}
            </span>
            {showPendingDetail ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {showPendingDetail && pendingVisits.length > 0 && (
          <div className="table-container" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Pagado</th>
                  <th style={{ textAlign: 'right' }}>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {pendingVisits.map(v => {
                  const badgeMap: Record<string, string> = {
                    'Abierta': 'badge-blue',
                    'En Proceso': 'badge-purple',
                    'Pendiente': 'badge-amber',
                  };
                  return (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600 }}>{v.clienteNombre}</td>
                      <td>{formatDate(v.fecha)}</td>
                      <td><span className={`badge ${badgeMap[v.estado] || 'badge-blue'}`}>{v.estado}</span></td>
                      <td style={{ textAlign: 'right' }}>{formatMoney(v.totalServicios)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-green)' }}>{formatMoney(v.totalPagado)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-red)' }}>{formatMoney(v.saldo)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showPendingDetail && pendingVisits.length === 0 && (
          <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 20, marginTop: 12 }}>
            ✅ No hay cuentas pendientes de cobro.
          </p>
        )}
      </div>
    </div>
  );
}
