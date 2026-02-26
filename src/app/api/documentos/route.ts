import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Listar documentos del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const expedienteId = searchParams.get('expedienteId')

    // Cliente ve documentos de su expediente
    if (user.rol === 'cliente') {
      const expediente = await prisma.expediente.findUnique({
        where: { clienteId: user.userId },
      })

      if (!expediente) {
        return NextResponse.json({ documentos: [], checklist: [], faseActual: 1 })
      }

      const documentos = await prisma.documento.findMany({
        where: { expedienteId: expediente.id },
        orderBy: { createdAt: 'desc' },
      })

      const checklist = await prisma.checklistDocumento.findMany({
        where: { expedienteId: expediente.id },
        orderBy: { orden: 'asc' },
      })

      return NextResponse.json({ 
        documentos, 
        checklist,
        faseActual: expediente.faseActual,
        expedienteId: expediente.id
      })
    }

    // Abogado ve documentos de expedientes asignados
    if (user.rol === 'abogado') {
      if (expedienteId) {
        const expediente = await prisma.expediente.findUnique({
          where: { id: expedienteId },
        })
        
        if (!expediente || expediente.abogadoAsignadoId !== user.userId) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const documentos = await prisma.documento.findMany({
          where: { expedienteId: expediente.id },
          orderBy: { createdAt: 'desc' },
        })

        const checklist = await prisma.checklistDocumento.findMany({
          where: { expedienteId: expediente.id },
          orderBy: { orden: 'asc' },
        })

        return NextResponse.json({ 
          documentos, 
          checklist,
          faseActual: expediente.faseActual,
          expedienteId: expediente.id
        })
      }

      // Si no hay expedienteId, devolver documentos de todos los expedientes asignados
      const expedientes = await prisma.expediente.findMany({
        where: { abogadoAsignadoId: user.userId },
        select: { id: true },
      })

      const expedienteIds = expedientes.map(e => e.id)

      const documentos = await prisma.documento.findMany({
        where: { expedienteId: { in: expedienteIds } },
        orderBy: { createdAt: 'desc' },
        include: {
          expediente: {
            select: { referencia: true }
          }
        }
      })

      return NextResponse.json({ documentos, checklist: [], faseActual: 0 })
    }

    // Admin ve documentos según expediente
    if (user.rol === 'admin') {
      if (expedienteId) {
        const documentos = await prisma.documento.findMany({
          where: { expedienteId },
          orderBy: { createdAt: 'desc' },
        })

        const expediente = await prisma.expediente.findUnique({
          where: { id: expedienteId },
          select: { faseActual: true }
        })

        const checklist = await prisma.checklistDocumento.findMany({
          where: { expedienteId },
          orderBy: { orden: 'asc' },
        })

        return NextResponse.json({ 
          documentos, 
          checklist,
          faseActual: expediente?.faseActual || 1,
          expedienteId
        })
      }

      // Devolver todos los documentos
      const documentos = await prisma.documento.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          expediente: {
            select: { referencia: true }
          }
        }
      })

      return NextResponse.json({ documentos, checklist: [], faseActual: 0 })
    }

    return NextResponse.json({ documentos: [], checklist: [] })
  } catch (error) {
    console.error('Error obteniendo documentos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Subir nuevo documento con contenido
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, tipo, contenido, nombreArchivo, expedienteId } = body

    if (!nombre || !tipo) {
      return NextResponse.json(
        { error: 'Nombre y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Si es cliente, obtener su expediente
    let expId = expedienteId
    let faseActual = 1
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
      faseActual = expediente.faseActual
    } else if (expedienteId) {
      const expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
        select: { faseActual: true },
      })
      faseActual = expediente?.faseActual || 1
    }

    // Verificar acceso para abogados
    if (user.rol === 'abogado' && expedienteId) {
      const expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
      })
      if (!expediente || expediente.abogadoAsignadoId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    if (!expId) {
      return NextResponse.json(
        { error: 'Expediente no especificado' },
        { status: 400 }
      )
    }

    // Crear documento
    const documento = await prisma.documento.create({
      data: {
        expedienteId: expId,
        nombre,
        tipo,
        contenido: contenido || null,
        nombreArchivo: nombreArchivo || null,
        estado: 'subido',
        fase: faseActual,
        fechaSubida: new Date(),
        subidoPorId: user.userId,
      },
    })

    // Actualizar checklist si existe
    const checklistItem = await prisma.checklistDocumento.findFirst({
      where: {
        expedienteId: expId,
        nombre: { contains: tipo, mode: 'insensitive' },
      },
    })

    if (checklistItem) {
      await prisma.checklistDocumento.update({
        where: { id: checklistItem.id },
        data: { documentoId: documento.id },
      })
    }

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
