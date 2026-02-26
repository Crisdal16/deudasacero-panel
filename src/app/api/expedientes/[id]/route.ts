import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener detalle completo de un expediente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Construir where según el rol
    let where: any = { id }
    
    if (user.rol === 'cliente') {
      where.clienteId = user.userId
    } else if (user.rol === 'abogado') {
      where.abogadoAsignadoId = user.userId
    }
    // Admin puede ver cualquier expediente

    const expediente = await prisma.expediente.findFirst({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            nif: true,
          }
        },
        abogadoAsignado: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        },
        deudas: {
          select: {
            id: true,
            tipo: true,
            importe: true,
            descripcion: true,
            acreedor: true,
          }
        },
        documentos: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            estado: true,
            fechaSubida: true,
            nombreArchivo: true,
            esRequerido: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        mensajes: {
          include: {
            usuario: {
              select: { nombre: true }
            }
          },
          orderBy: { fechaEnvio: 'asc' }
        },
        checklist: {
          orderBy: { orden: 'asc' }
        },
      }
    })

    if (!expediente) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
    }

    // Calcular totales
    const deudaTotal = expediente.deudas.reduce((sum, d) => sum + d.importe, 0)
    const documentosPendientes = expediente.documentos.filter(d => d.estado === 'pendiente' || d.estado === 'subido').length
    const mensajesNuevos = expediente.mensajes.filter(m => !m.leido && m.remitente !== user.rol).length

    // Formatear mensajes
    const mensajesFormateados = expediente.mensajes.map(msg => ({
      id: msg.id,
      texto: msg.texto,
      remitente: msg.remitente,
      remitenteNombre: msg.usuario?.nombre || 'Sistema',
      fechaEnvio: msg.fechaEnvio.toISOString(),
      leido: msg.leido,
      archivoNombre: msg.archivoNombre || (msg as any).archivoNombre,
      archivoContenido: (msg as any).archivoContenido,
    }))

    return NextResponse.json({
      expediente: {
        ...expediente,
        deudaTotal,
        documentosPendientes,
        mensajesNuevos,
        mensajes: mensajesFormateados,
      }
    })
  } catch (error) {
    console.error('Error obteniendo expediente:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
