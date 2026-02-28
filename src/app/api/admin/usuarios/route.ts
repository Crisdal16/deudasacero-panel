import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const rol = searchParams.get('rol')

      const where: any = {}
      if (rol) where.rol = rol

      const usuarios = await prisma.usuario.findMany({
        where,
        select: {
          id: true,
          email: true,
          nombre: true,
          telefono: true,
          nif: true,
          rol: true,
          activo: true,
          ultimoAcceso: true,
          createdAt: true,
          _count: {
            select: {
              expedientesComoCliente: true,
              expedientesComoAbogado: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ usuarios })
    } catch (error) {
      console.error('Error obteniendo usuarios:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}

// Crear nuevo cliente (admin)
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const body = await request.json()
      const { 
        nombre, 
        email, 
        password, 
        telefono, 
        nif,
        crearExpediente = false,
        referencia,
        tipoProcedimiento = 'persona_fisica'
      } = body

      if (!nombre || !email || !password) {
        return NextResponse.json(
          { error: 'Nombre, email y contraseña son obligatorios' },
          { status: 400 }
        )
      }

      // Verificar si el email ya existe
      const existeUsuario = await prisma.usuario.findUnique({
        where: { email },
      })

      if (existeUsuario) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con ese email' },
          { status: 400 }
        )
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10)

      // Crear usuario y opcionalmente expediente
      const result = await prisma.$transaction(async (tx) => {
        // Crear cliente
        const cliente = await tx.usuario.create({
          data: {
            nombre,
            email,
            password: hashedPassword,
            telefono,
            nif,
            rol: 'cliente',
          },
        })

        // Si se solicita crear expediente
        let expediente: Awaited<ReturnType<typeof tx.expediente.create>> | null = null
        if (crearExpediente) {
          const year = new Date().getFullYear()
          const count = await tx.expediente.count()
          const ref = referencia || `LSO-${year}-${String(count + 1).padStart(3, '0')}`

          expediente = await tx.expediente.create({
            data: {
              referencia: ref,
              clienteId: cliente.id,
              tipoProcedimiento,
              faseActual: 1,
              porcentajeAvance: 5,
            },
          })

          // Crear checklist inicial
          const checklistItems = [
            'DNI/NIE', 'IRPF últimos 2 años', 'Vida laboral completa',
            'Certificado paro (si aplica)', 'Certificado empadronamiento',
            'Extractos bancarios 6 meses', 'Certificado AEAT deudas',
            'Certificado Seguridad Social', 'Escrituras propiedades (si aplica)',
            'Contrato trabajo actual', 'Últimas 3 nóminas'
          ]

          for (let i = 0; i < checklistItems.length; i++) {
            await tx.checklistDocumento.create({
              data: {
                expedienteId: expediente.id,
                nombre: checklistItems[i],
                orden: i + 1,
                obligatorio: true,
              },
            })
          }
        }

        return { cliente, expediente }
      })

      return NextResponse.json({
        success: true,
        usuario: {
          id: result.cliente.id,
          nombre: result.cliente.nombre,
          email: result.cliente.email,
          rol: result.cliente.rol,
        },
        expediente: result.expediente ? {
          id: result.expediente.id,
          referencia: result.expediente.referencia,
        } : null,
      })
    } catch (error) {
      console.error('Error creando cliente:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}
