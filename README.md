# Deudas a Cero - Panel de Clientes

Sistema de gestión de expedientes para la Ley de Segunda Oportunidad (LSO).

## 🚀 Características Fase 1

- ✅ **Sistema de roles**: Admin, Abogado Externo, Cliente
- ✅ **Panel de administración**: Gestión de expedientes y abogados
- ✅ **Panel de abogado externo**: Visualización de expedientes asignados
- ✅ **Panel de cliente**: Seguimiento de su expediente
- ✅ **Sistema de mensajería**: Comunicación entre usuarios
- ✅ **Gestión documental**: Subida y revisión de documentos
- ✅ **Timeout de sesión**: 30 min de inactividad para abogados

## 📋 Requisitos

- Node.js 18+
- Cuenta en Vercel
- Base de datos PostgreSQL (Neon recomendado)

## 🔧 Instalación

### 1. Clonar repositorio
```bash
git clone https://github.com/TU_USUARIO/deudasacero-panel.git
cd deudasacero-panel
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/database?sslmode=require"
JWT_SECRET="tu-clave-secreta-super-segura-2024"
```

### 4. Inicializar base de datos
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

## 🚀 Despliegue en Vercel

### 1. Crear proyecto en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Configura las variables de entorno:
   - `DATABASE_URL`
   - `JWT_SECRET`

### 2. Desplegar
Vercel detectará automáticamente que es un proyecto Next.js y lo desplegará.

## 👤 Credenciales de prueba

Después de ejecutar el seed:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@deudasacero.es | Admin123! |
| Abogado | abogado@ejemplo.com | Abogado123! |
| Cliente | cliente@ejemplo.com | Cliente123! |

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── api/           # API Routes
│   │   ├── auth/      # Autenticación
│   │   ├── admin/     # Endpoints admin
│   │   ├── abogado/   # Endpoints abogado
│   │   └── ...
│   ├── page.tsx       # Página principal
│   └── layout.tsx     # Layout
├── components/
│   ├── deudasacero/   # Componentes específicos
│   └── ui/            # Componentes UI (shadcn)
├── lib/
│   ├── auth.ts        # Lógica de autenticación
│   └── db.ts          # Conexión a BD
└── hooks/             # Hooks personalizados

prisma/
├── schema.prisma      # Esquema de la BD
└── seed.ts            # Datos de prueba
```

## 🔐 Sistema de roles

### Admin
- Acceso completo a todos los expedientes
- Crear y gestionar abogados externos
- Asignar expedientes a abogados
- Ver estadísticas globales

### Abogado Externo
- Ver solo expedientes asignados
- Enviar mensajes a clientes
- Timeout de sesión: 30 min de inactividad

### Cliente
- Ver su propio expediente
- Subir documentos
- Enviar mensajes

## 📊 Fases del proceso LSO

1. Estudio viabilidad
2. Presupuesto y encargo
3. Recopilación docs
4. Presentación demanda
5. Admisión concurso
6. Liquidación
7. Solicitud EPI
8. Resolución
9. Recurso
10. Finalizado

## 🛠 Tecnologías

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **UI**: shadcn/ui
- **Backend**: Next.js API Routes
- **Base de datos**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Auth**: JWT con cookies httpOnly

## 📝 Licencia

Privado - Deudas a Cero © 2024
