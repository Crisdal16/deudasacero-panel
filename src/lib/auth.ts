import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'deudasacero-secret-key-2024-super-secure'
)

// Tiempo de inactividad máximo para abogados (en segundos)
const ABOGADO_TIMEOUT = 30 * 60 // 30 minutos

export interface UserPayload {
  userId: string
  email: string
  nombre: string
  rol: 'admin' | 'abogado' | 'cliente'
  ultimoAcceso: number
}

// Generar token JWT
export async function signToken(payload: UserPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY)
}

// Verificar token JWT
export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as UserPayload
  } catch {
    return null
  }
}

// Crear sesión
export async function createSession(user: UserPayload): Promise<void> {
  const token = await signToken(user)
  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  })
}

// Obtener usuario actual desde la cookie
export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  
  const user = verifyToken(token)
  
  // Verificar timeout para abogados
  if (user) {
    const now = Date.now()
    const lastAccess = user.ultimoAcceso || now
    
    if (user.rol === 'abogado' && (now - lastAccess) > ABOGADO_TIMEOUT * 1000) {
      return null // Sesión expirada por inactividad
    }
  }
  
  return user
}

// Cerrar sesión
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

// Verificar credenciales y hacer login
export async function authenticateUser(email: string, password: string): Promise<UserPayload | null> {
  const user = await prisma.usuario.findUnique({
    where: { email },
  })

  if (!user || !user.activo) return null

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return null

  // Actualizar último acceso
  await prisma.usuario.update({
    where: { id: user.id },
    data: { ultimoAcceso: new Date() },
  })

  return {
    userId: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol as 'admin' | 'abogado' | 'cliente',
    ultimoAcceso: Date.now(),
  }
}

// Registrar nuevo usuario cliente
export async function registerUser(data: {
  nombre: string
  email: string
  password: string
  telefono?: string
  nif?: string
}): Promise<UserPayload | null> {
  const existingUser = await prisma.usuario.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw new Error('El email ya está registrado')
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: hashedPassword,
      telefono: data.telefono,
      nif: data.nif,
      rol: 'cliente',
    },
  })

  return {
    userId: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: 'cliente',
    ultimoAcceso: Date.now(),
  }
}

// Crear usuario abogado (solo admin)
export async function createAbogado(data: {
  nombre: string
  email: string
  password: string
  telefono?: string
}): Promise<UserPayload | null> {
  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: hashedPassword,
      telefono: data.telefono,
      rol: 'abogado',
    },
  })

  return {
    userId: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: 'abogado',
    ultimoAcceso: Date.now(),
  }
}

// Verificar si el usuario es admin
export function isAdmin(user: UserPayload | null): boolean {
  return user?.rol === 'admin'
}

// Verificar si el usuario es abogado
export function isAbogado(user: UserPayload | null): boolean {
  return user?.rol === 'abogado'
}

// Verificar si el usuario es cliente
export function isCliente(user: UserPayload | null): boolean {
  return user?.rol === 'cliente'
}

// Middleware para proteger rutas API
export async function withAuth(
  request: NextRequest,
  handler: (user: UserPayload, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await verifyToken(token)

  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  // Verificar timeout para abogados
  if (user.rol === 'abogado') {
    const now = Date.now()
    const lastAccess = user.ultimoAcceso || now
    if ((now - lastAccess) > ABOGADO_TIMEOUT * 1000) {
      return NextResponse.json({ error: 'Sesión expirada por inactividad' }, { status: 401 })
    }
  }

  return handler(user, request)
}

// Middleware para rutas de admin
export async function withAdminAuth(
  request: NextRequest,
  handler: (user: UserPayload, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await verifyToken(token)

  if (!user || user.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de administrador.' }, { status: 403 })
  }

  return handler(user, request)
}

// Middleware para rutas de abogado o admin
export async function withAbogadoOrAdminAuth(
  request: NextRequest,
  handler: (user: UserPayload, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = request.cookies.get('session')?.value

  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await verifyToken(token)

  if (!user || (user.rol !== 'admin' && user.rol !== 'abogado')) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  // Verificar timeout para abogados
  if (user.rol === 'abogado') {
    const now = Date.now()
    const lastAccess = user.ultimoAcceso || now
    if ((now - lastAccess) > ABOGADO_TIMEOUT * 1000) {
      return NextResponse.json({ error: 'Sesión expirada por inactividad' }, { status: 401 })
    }
  }

  return handler(user, request)
}

// Verificar acceso a expediente
export async function canAccessExpediente(
  user: UserPayload,
  expedienteId: string
): Promise<boolean> {
  // Admin puede acceder a todo
  if (user.rol === 'admin') return true

  const expediente = await prisma.expediente.findUnique({
    where: { id: expedienteId },
    select: { clienteId: true, abogadoAsignadoId: true },
  })

  if (!expediente) return false

  // Cliente solo puede ver su propio expediente
  if (user.rol === 'cliente') {
    return expediente.clienteId === user.userId
  }

  // Abogado solo puede ver expedientes asignados
  if (user.rol === 'abogado') {
    return expediente.abogadoAsignadoId === user.userId
  }

  return false
}
