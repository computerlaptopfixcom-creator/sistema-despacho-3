import { jsPDF } from 'jspdf';
import type { Payment, VisitService } from '../types';

type ReceiptData = {
  clienteNombre: string;
  clienteTelefono: string;
  visitaFecha: string;
  visitaHora: string;
  servicios: VisitService[];
  totalServicios: number;
  payment: Payment;
  totalPagado: number;
  saldoPendiente: number;
  despachoNombre?: string;
};

const formatMoney = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateTime = (isoStr: string) => {
  const d = new Date(isoStr);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export function generateReceipt(data: ReceiptData) {
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] });
  const w = 80;
  const margin = 6;
  const usable = w - margin * 2;
  let y = 10;

  // Header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.despachoNombre || 'Despacho Fiscal', w / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('RECIBO DE PAGO', w / 2, y, { align: 'center' });
  y += 4;

  // Line
  doc.setDrawColor(180);
  doc.line(margin, y, w - margin, y);
  y += 5;

  // Folio
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Folio:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.payment.folio, margin + 12, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateTime(data.payment.fecha), margin + 12, y);
  y += 6;

  // Client
  doc.setDrawColor(180);
  doc.line(margin, y, w - margin, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clienteNombre, margin + 14, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Tel:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clienteTelefono, margin + 14, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Atención:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDate(data.visitaFecha)} ${data.visitaHora}`, margin + 18, y);
  y += 6;

  // Services
  doc.setDrawColor(180);
  doc.line(margin, y, w - margin, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SERVICIOS', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  for (const s of data.servicios) {
    const nameText = `${s.cantidad}x ${s.nombre}`;
    const priceText = formatMoney(s.subtotal);
    doc.text(nameText, margin, y, { maxWidth: usable - 20 });
    doc.text(priceText, w - margin, y, { align: 'right' });
    y += 4;
  }

  y += 1;
  doc.setDrawColor(180);
  doc.line(margin, y, w - margin, y);
  y += 4;

  // Totals
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Servicios:', margin, y);
  doc.text(formatMoney(data.totalServicios), w - margin, y, { align: 'right' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.text('Total Pagado:', margin, y);
  doc.text(formatMoney(data.totalPagado), w - margin, y, { align: 'right' });
  y += 4;

  if (data.saldoPendiente > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Saldo Pendiente:', margin, y);
    doc.text(formatMoney(data.saldoPendiente), w - margin, y, { align: 'right' });
    y += 5;
  }

  // Payment detail
  doc.setDrawColor(180);
  doc.line(margin, y, w - margin, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PAGO REGISTRADO', w / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Monto: ${formatMoney(data.payment.monto)}`, margin, y);
  y += 4;
  doc.text(`Método: ${data.payment.metodo}`, margin, y);
  y += 4;
  if (data.payment.notas) {
    doc.text(`Notas: ${data.payment.notas}`, margin, y, { maxWidth: usable });
    y += 4;
  }

  y += 4;
  doc.setDrawColor(180);
  doc.line(margin, y, w - margin, y);
  y += 5;

  // Footer
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.text('Gracias por su confianza.', w / 2, y, { align: 'center' });
  y += 3;
  doc.text('Este recibo no es un comprobante fiscal.', w / 2, y, { align: 'center' });

  // Save PDF
  doc.save(`Recibo_${data.payment.folio}.pdf`);
}

export function generateVisitSummary(data: {
  clienteNombre: string;
  clienteTelefono: string;
  visitaFecha: string;
  visitaHora: string;
  estado: string;
  servicios: VisitService[];
  totalServicios: number;
  payments: Payment[];
  totalPagado: number;
  saldoPendiente: number;
  notas: string;
  atendidoPor: string;
}) {
  const doc = new jsPDF();
  const margin = 20;
  const pageW = 210;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Atención', margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Despacho Fiscal — Sistema de Gestión', margin, y);
  doc.setTextColor(0);
  y += 10;

  // Line
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Client info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del Cliente', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${data.clienteNombre}`, margin, y);
  y += 5;
  doc.text(`Teléfono: ${data.clienteTelefono}`, margin, y);
  y += 5;
  doc.text(`Fecha: ${formatDate(data.visitaFecha)} a las ${data.visitaHora}`, margin, y);
  y += 5;
  doc.text(`Estado: ${data.estado}`, margin, y);
  if (data.atendidoPor) {
    y += 5;
    doc.text(`Atendido por: ${data.atendidoPor}`, margin, y);
  }
  y += 8;

  // Services
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Servicios', margin, y);
  y += 7;

  if (data.servicios.length > 0) {
    // Table header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 3, pageW - margin * 2, 6, 'F');
    doc.text('Servicio', margin + 2, y);
    doc.text('Cant.', 120, y);
    doc.text('P. Unit.', 140, y);
    doc.text('Subtotal', 165, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const s of data.servicios) {
      doc.text(s.nombre, margin + 2, y, { maxWidth: 80 });
      doc.text(s.cantidad.toString(), 123, y);
      doc.text(formatMoney(s.precioUnitario), 140, y);
      doc.text(formatMoney(s.subtotal), 165, y);
      y += 6;
    }

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${formatMoney(data.totalServicios)}`, 165, y, { align: 'right' });
    y += 8;
  } else {
    doc.setFontSize(9);
    doc.text('No se registraron servicios.', margin, y);
    y += 8;
  }

  // Payments
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Pagos', margin, y);
  y += 7;

  if (data.payments.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 3, pageW - margin * 2, 6, 'F');
    doc.text('Folio', margin + 2, y);
    doc.text('Fecha', 65, y);
    doc.text('Método', 110, y);
    doc.text('Monto', 150, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const p of data.payments) {
      doc.text(p.folio, margin + 2, y);
      doc.text(formatDateTime(p.fecha), 65, y);
      doc.text(p.metodo, 110, y);
      doc.text(formatMoney(p.monto), 150, y);
      y += 6;
    }

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Pagado: ${formatMoney(data.totalPagado)}`, margin, y);
    if (data.saldoPendiente > 0) {
      doc.text(`Saldo Pendiente: ${formatMoney(data.saldoPendiente)}`, 110, y);
    }
    y += 8;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('No se registraron pagos.', margin, y);
    y += 8;
  }

  // Notes
  if (data.notas) {
    doc.setDrawColor(200);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Notas', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(data.notas, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 6;
  }

  // Footer
  y += 4;
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text('Documento generado por Sistema Despacho — No es comprobante fiscal.', margin, y);

  doc.save(`Resumen_${data.clienteNombre.replace(/\s/g, '_')}_${data.visitaFecha}.pdf`);
}
