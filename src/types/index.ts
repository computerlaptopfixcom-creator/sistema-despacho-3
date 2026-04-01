export type Client = {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  curp?: string;
  notasGenerales?: string;
  fechaAlta: string;
};

export type VisitStatus = 'Abierta' | 'En Proceso' | 'Pendiente' | 'Finalizada';

export type DocumentItem = {
  nombre: string;
  recibido: boolean;
};

export type Service = {
  id: string;
  nombre: string;
  categoria: 'Pensiones' | 'Fiscal' | 'General';
  descripcion: string;
  precioBase: number;
  atiende?: string;
  activo: boolean;
};

export type VisitService = {
  serviceId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
};

export type Payment = {
  id: string;
  visitaId: string;
  clienteId: string;
  monto: number;
  fecha: string;
  metodo: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  folio: string;
  notas?: string;
};

export type Visit = {
  id: string;
  clienteId: string;
  fecha: string;
  hora: string;
  estado: VisitStatus;
  notas: string;
  documentosRecibidos: DocumentItem[];
  documentosFaltantes: string;
  atendidoPor: string;
  servicios: VisitService[];
  totalServicios: number;
};

export type AppointmentStatus = 'Programada' | 'Confirmada' | 'Completada' | 'Cancelada' | 'No asistió';

export type Appointment = {
  id: string;
  clienteId?: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: AppointmentStatus;
  notas?: string;
};
