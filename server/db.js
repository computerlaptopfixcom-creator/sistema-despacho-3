import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/despacho3',
});

// Initialize database tables
export async function initDB(retries = 5) {
  while (retries > 0) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre TEXT NOT NULL,
          telefono TEXT NOT NULL,
          curp TEXT DEFAULT '',
          notas_generales TEXT DEFAULT '',
          fecha_alta TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS services (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre TEXT NOT NULL,
          categoria TEXT NOT NULL DEFAULT 'General',
          descripcion TEXT DEFAULT '',
          precio_base NUMERIC(10,2) NOT NULL DEFAULT 0,
          activo BOOLEAN DEFAULT true
        );

        CREATE TABLE IF NOT EXISTS visits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
          fecha DATE NOT NULL,
          hora TEXT NOT NULL,
          estado TEXT DEFAULT 'Abierta',
          notas TEXT DEFAULT '',
          documentos_recibidos JSONB DEFAULT '[]',
          documentos_faltantes TEXT DEFAULT '',
          atendido_por TEXT DEFAULT '',
          servicios JSONB DEFAULT '[]',
          total_servicios NUMERIC(10,2) DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          visita_id UUID REFERENCES visits(id) ON DELETE CASCADE,
          cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
          monto NUMERIC(10,2) NOT NULL,
          fecha TIMESTAMPTZ DEFAULT NOW(),
          metodo TEXT NOT NULL,
          folio TEXT NOT NULL,
          notas TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS appointments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          cliente_id UUID REFERENCES clients(id) ON DELETE SET NULL,
          cliente_nombre TEXT NOT NULL,
          cliente_telefono TEXT NOT NULL,
          fecha DATE NOT NULL,
          hora TEXT NOT NULL,
          motivo TEXT DEFAULT 'Consulta general',
          estado TEXT DEFAULT 'Programada',
          notas TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS client_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          filepath TEXT NOT NULL,
          mimetype TEXT NOT NULL,
          size BIGINT NOT NULL,
          upload_date TIMESTAMPTZ DEFAULT NOW(),
          uploaded_by TEXT DEFAULT 'Administrador'
        );
      `);

      // Seed default services if empty
      const { rows } = await pool.query('SELECT COUNT(*) FROM services');
      if (parseInt(rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO services (nombre, categoria, descripcion, precio_base, activo) VALUES
          ('Diagnóstico de Pensión', 'Pensiones', 'Estudio de semanas cotizadas y modalidad de pensión', 1500, true),
          ('Trámite de Pensión IMSS', 'Pensiones', 'Gestión completa del trámite de pensión ante el IMSS', 8000, true),
          ('Corrección de Semanas Cotizadas', 'Pensiones', 'Aclaración y corrección ante IMSS', 3000, true),
          ('Declaración Anual PF', 'Fiscal', 'Presentación de declaración anual para Persona Física', 800, true),
          ('Constancia de Situación Fiscal', 'Fiscal', 'Trámite de obtención o actualización', 200, true),
          ('Alta en el SAT', 'Fiscal', 'Inscripción al RFC y régimen fiscal', 500, true),
          ('Consultoría General', 'General', 'Asesoría y orientación general', 500, true);
        `);
      }

      console.log('✅ Database initialized');
      return; // Exit on success
    } catch (error) {
      console.log(`⏳ Waiting for database to be ready... (${retries} retries left): ${error.message}`);
      retries -= 1;
      if (retries === 0) throw error;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

export default pool;
