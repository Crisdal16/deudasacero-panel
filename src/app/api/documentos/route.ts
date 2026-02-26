import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Listar documentos del usuario
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Cliente ve documentos de su expediente
    if (user.rol === 'cliente') {
      const expediente = await prisma.expediente.findUnique({
        where: { clienteId: user.userId },
      })

      if (!expediente) {
        return NextResponse.json({ documentos: [], checklist: [] })
      }

      const documentos = await prisma.documento.findMany({
        where: { expedienteId: expediente.id, esJudicial: false },
        orderBy: { createdAt: 'desc' },
      })

      const checklist = await prisma.checklistDocumento.findMany({
        where: { expedienteId: expediente.id },
        orderBy: { orden: 'asc' },
      })

      return NextResponse.json({ documentos, checklist })
    }

    // Admin y abogado ven documentos según el expediente
    return NextResponse.json({ documentos: [], checklist: [] })
  } catch (error) {
    console.error('Error obteniendo documentos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Subir nuevo documento
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, tipo, contenido, expedienteId } = body

    if (!nombre || !tipo) {
      return NextResponse.json(
        { error: 'Nombre y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Si es cliente, obtener su expediente
    let expId = expedienteId
    if (user.rol === 'cliente') {
      const expediente = await prisma.expediente.findUnique({
        where: { clienteId: user.userId },
      })
      if (!expediente) {
        return NextResponse.json(
          { error: 'No tienes un expediente activo' },
          { status: 400 }
        )
      }
      expId = expediente.id
    }

    if (!expId) {
      return NextResponse.json(
        { error: 'Expediente no especificado' },
        { status: 400 }
      )
    }

    const documento = await prisma.documento.create({
      data: {
        expedienteId: expId,
        nombre,
        tipo,
        contenido: contenido || null,
        estado: 'subido',
        fechaSubida: new Date(),
        subidoPorId: user.userId,
      },
    })

    return NextResponse.json({ success: true, documento })
  } catch (error) {
    console.error('Error subiendo documento:', error)
    return NextResponse.json(
      { error: 'Error al subir documento' },
      { status: 500 }
    )
  }
}

// PATCH - Cambiar estado de documento (solo admin)
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, estado, notas } = body

    if (!id || !estado) {
      return NextResponse.json(
        { error: 'ID y estado son requeridos' },
        { status: 400 }
      )
    }

    const documento = await prisma.documento.update({
      where: { id },
      data: { estado, notas },
    })

    return NextResponse.json({ success: true, documento })
  } catch (error) {
    console.error('Error actualizando documento:', error)
    return NextResponse.json(
      { error: 'Error al actualizar documento' },
      { status: 500 }
    )
  }
}
