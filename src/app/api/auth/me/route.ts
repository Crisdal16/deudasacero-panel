import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    // Obtener datos completos del usuario
    const fullUser = await prisma.usuario.findUnique({
      where: { id: user.userId },
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
      },
    })

    // Si es abogado, contar expedientes asignados
    let expedientesAsignados = 0
    if (fullUser?.rol === 'abogado') {
      expedientesAsignados = await prisma.expediente.count({
        where: { abogadoAsignadoId: user.userId, estado: 'activo' },
      })
    }

    // Si es cliente, obtener info de su expediente
    let expedienteCliente = null
    if (fullUser?.rol === 'cliente') {
      expedienteCliente = await prisma.expediente.findFirst({
        where: { clienteId: user.userId },
        select: {
          id: true,
          referencia: true,
          faseActual: true,
          porcentajeAvance: true,
          estado: true,
        },
      })
    }

    return NextResponse.json({
      user: {
        ...fullUser,
        expedientesAsignados,
        expedienteCliente,
      },
    })
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return NextResponse.json({ user: null })
  }
}
