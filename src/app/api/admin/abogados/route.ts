import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET - Listar todos los abogados
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const abogados = await prisma.usuario.findMany({
        where: { rol: 'abogado' },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          activo: true,
          ultimoAcceso: true,
          createdAt: true,
          _count: {
            select: {
              expedientesComoAbogado: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
      })

      return NextResponse.json({ abogados })
    } catch (error) {
      console.error('Error obteniendo abogados:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}

// POST - Crear nuevo abogado
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const body = await request.json()
      const { nombre, email, password, telefono } = body

      if (!nombre || !email || !password) {
        return NextResponse.json(
          { error: 'Nombre, email y contraseña son requeridos' },
          { status: 400 }
        )
      }

      // Verificar si el email ya existe
      const existingUser = await prisma.usuario.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const abogado = await prisma.usuario.create({
        data: {
          nombre,
          email,
          password: hashedPassword,
          telefono,
          rol: 'abogado',
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          activo: true,
          createdAt: true,
        },
      })

      return NextResponse.json({ abogado })
    } catch (error) {
      console.error('Error creando abogado:', error)
      return NextResponse.json(
        { error: 'Error al crear abogado' },
        { status: 500 }
      )
    }
  })
}
