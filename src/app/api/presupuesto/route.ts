import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener presupuesto del expediente
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let expedienteId: string | undefined

    // Cliente obtiene su propio expediente
    if (user.rol === 'cliente') {
      const expediente = await prisma.expediente.findFirst({
        where: { clienteId: user.userId },
      })
      expedienteId = expediente?.id
    }
    // Admin puede especificar expedienteId
    else if (user.rol === 'admin') {
      const { searchParams } = new URL(request.url)
      expedienteId = searchParams.get('expedienteId') || undefined
      
      if (!expedienteId) {
        // Si no especifica, buscar cualquier expediente
        const primerExpediente = await prisma.expediente.findFirst()
        expedienteId = primerExpediente?.id
      }
    }
    // Abogado obtiene expedientes asignados
    else if (user.rol === 'abogado') {
      const expediente = await prisma.expediente.findFirst({
        where: { abogadoAsignadoId: user.userId },
      })
      expedienteId = expediente?.id
    }

    if (!expedienteId) {
      return NextResponse.json({ presupuesto: null })
    }

    // Buscar documento de presupuesto (tipo = 'presupuesto' o nombre que contenga 'presupuesto')
    const presupuesto = await prisma.documento.findFirst({
      where: {
        expedienteId,
        OR: [
          { tipo: 'presupuesto' },
          { nombre: { contains: 'presupuesto', mode: 'insensitive' } },
          { nombre: { contains: 'encargo', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!presupuesto) {
      return NextResponse.json({ presupuesto: null })
    }

    return NextResponse.json({
      presupuesto: {
        id: presupuesto.id,
        nombre: presupuesto.nombre,
        nombreArchivo: presupuesto.nombreArchivo,
        contenido: presupuesto.contenido,
        fechaSubida: presupuesto.fechaSubida?.toISOString() || presupuesto.createdAt.toISOString(),
        estado: presupuesto.estado,
      },
    })
  } catch (error) {
    console.error('Error obteniendo presupuesto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Subir presupuesto (solo admin)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado. Solo admin puede subir presupuestos.' }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, contenido, nombreArchivo, expedienteId } = body

    if (!nombre || !contenido || !nombreArchivo) {
      return NextResponse.json(
        { error: 'Nombre, contenido y nombre de archivo son requeridos' },
        { status: 400 }
      )
    }

    // Si no hay expedienteId, crear uno nuevo o usar el primero
    let expId = expedienteId
    if (!expId) {
      const expediente = await prisma.expediente.findFirst()
      if (!expediente) {
        return NextResponse.json(
          { error: 'No hay expedientes disponibles' },
          { status: 400 }
        )
      }
      expId = expediente.id
    }

    // Crear documento de presupuesto
    const documento = await prisma.documento.create({
      data: {
        expedienteId: expId,
        nombre,
        tipo: 'presupuesto',
        contenido,
        nombreArchivo,
        estado: 'subido',
        fechaSubida: new Date(),
        subidoPorId: user.userId,
        fase: 2, // Fase de presupuesto
      },
    })

    return NextResponse.json({
      success: true,
      presupuesto: {
        id: documento.id,
        nombre: documento.nombre,
        nombreArchivo: documento.nombreArchivo,
        fechaSubida: documento.fechaSubida?.toISOString(),
        estado: documento.estado,
      },
    })
  } catch (error) {
    console.error('Error subiendo presupuesto:', error)
    return NextResponse.json(
      { error: 'Error al subir el presupuesto' },
      { status: 500 }
    )
  }
}
