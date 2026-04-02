# 🏢 Sistema Despacho Fiscal 2087

Sistema de gestión interna y agendamiento público para el Despacho Fiscal 2087. 
Construido con una arquitectura Full-Stack profesional preparada para despliegue en VPS (EasyPanel).

![Banner](src/assets/hero.png)

## 🚀 Características Principales

### 1. Panel Administrativo y Roles (Privado)
El sistema cuenta con un modelo de doble acceso para garantizar la privacidad y seguridad de la información:

**🔐 Modos de Acceso:**
- **Tab Administrador:** Ingreso mediante contraseña maestra (por defecto: `admin2087`). Tiene acceso total a clientes, finanzas, reportes, gestión de empleados y la agenda global.
- **Tab Empleado (Contador):** Ingreso mediante correo electrónico y contraseña individual. Los contadores tienen una vista restringida: **solo** pueden acceder a "Mi Agenda" y ver únicamente las citas que les han sido asignadas.

> **Nota para Empleados Seed:** Si se usan los datos de prueba autogenerados, los empleados por defecto tienen la contraseña `password123`.

### 2. Características Principales del CRM
- **Gestión de Clientes (Expediente Integral)**: Expedientes centralizados con historial clínico/fiscal, ahora con captura estandarizada de Correo Electrónico, CURP y Número de Seguridad Social (NSS) desde múltiples vistas de "Alta Rápida".
- **Agenda Dual Avanzada**:
  - **Vista Calendario Mensual** interactiva, indicando la ubicación e identificadores de color por estado.
  - **Vista Lista de Reservas** con tabla rica, menús desplegables para Estado y etiquetas de empleados designados.
- **Control de Visitas**: Registro detallado con servicios brindados y sub-totales.
- **Finanzas y Pagos**: Seguimiento de abonos, saldos pendientes y generación de **Recibos PDF**.
- **Catálogo de Servicios Avanzado**: Gestión CRUD con **iconos visuales dinámicos** y **asignación múltiple** (Multi-select) que vincula la base de datos de usuarios a cada servicio para automatizar las reservas y mostrar los avatares correspondientes.
### 3. Portal de Clientes (Público)
- **Ruta Autónoma**: `/agendar`
- **Mobile-first**: Formulario de 3 pasos diseñado para facilidad de uso (edad 55-60+).
- **Sincronización en Tiempo Real**: Evita dobles reservas leyendo desde PostgreSQL de forma instantánea.

---

## 💻 Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Vanilla CSS (`index.css`) con variables de diseño.
- **Backend API**: Node.js + Express
- **Base de Datos**: PostgreSQL (con autogeneración de esquema y seed de servicios).
- **Contenedores**: Docker (Dockerfile multi-stage para compilar React y servir Express).

---

## 🛠️ Arquitectura de Software

El sistema consolidó toda su información desde un estado local (`localStorage`) hacia una base de datos relacional robusta (**PostgreSQL**).

El flujo de aplicación es:
```text
[Cliente Web / Celular] 
         ↓ (Peticiones REST)
[Servidor Node/Express en Puerto 3001]
         ↓ (Consultas SQL)
[PostgreSQL Database]
```

---

## 🌐 Configuración y Despliegue en EasyPanel (Método Automático)

El repositorio incluye un `docker-compose.yml` que automatiza por completo la creación de la base de datos, la vinculación y el despliegue del sistema sin que tengas que copiar y pegar variables manualmente.

### Pasos:
1. En EasyPanel, crea un proyecto nuevo.
2. Selecciona **"Templates"** o **"Services"** y elige crear un servicio usando **Github**.
3. Selecciona tu repositorio `sistema-despacho-3` (rama `master`).
4. **IMPORTANTE**: Asegúrate de marcar la opción que busca y usa tu archivo `docker-compose.yml`. (EasyPanel detectará ambos servicios: la app y la base de datos).
5. Haz clic en **Deploy**. 

> ¡Eso es todo! La base de datos y la aplicación web se enlazarán solas con una contraseña predefinida, y el sistema se inicializará por completo. La contraseña de administrador por defecto será: `DespachoAdmin2087!`. Puedes cambiarla después si quieres.

> **Nota**: El sistema incluye "Autoseeding". La primera vez que arranque, la base de datos creará las tablas de *clients*, *visits*, *services*, *payments* y *appointments*, y precargará los servicios principales de diagnóstico de pensión.

---

## 💻 Desarrollo Local

Si deseas clonar y correr el proyecto en tu máquina local:

1. Instala dependencias:
```bash
npm install
```

2. Necesitas una instancia local de PostgreSQL. Crea una base de datos y define tu archivo `.env` o la variable de entorno temporal.

3. Corre el servidor backend:
```bash
npm run server
```

4. En otra terminal, corre el entorno de desarrollo de Vite (que hace proxy automático a `:3001`):
```bash
npm run dev
```

---

**© 2026 Desarrollado por David Hielo para Despacho Fiscal 2087.**
