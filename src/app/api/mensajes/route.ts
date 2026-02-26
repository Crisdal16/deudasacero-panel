import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Listar mensajes del expediente con nombre del remitente
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const expedienteId = searchParams.get('expedienteId')

    let expId = expedienteId

    // Cliente solo ve mensajes de su expediente
    if (user.rol === 'cliente') {
      const expediente = await prisma.expediente.findUnique({
        where: { clienteId: user.userId },
      })
      if (!expediente) {
        return NextResponse.json({ mensajes: [] })
      }
      expId = expediente.id
    }

    // Abogado solo ve mensajes de expedientes asignados
    if (user.rol === 'abogado' && expedienteId) {
      const expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
      })
      if (!expediente || expediente.abogadoAsignadoId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Admin puede ver cualquier expediente
    if (user.rol === 'admin' && expedienteId) {
      expId = expedienteId
    }

    if (!expId) {
      return NextResponse.json({ mensajes: [] })
    }

    // Obtener mensajes con información del remitente
    const mensajes = await prisma.mensaje.findMany({
      where: { expedienteId: expId },
      orderBy: { fechaEnvio: 'asc' },
      include: {
        usuario: {
          select: {
            nombre: true,
            rol: true,
          },
        },
      },
    })

    // Marcar mensajes recibidos como leídos
    const remitenteOpuesto = user.rol === 'cliente' 
      ? ['admin', 'abogado'] 
      : ['cliente']
    
    await prisma.mensaje.updateMany({
      where: {
        expedienteId: expId,
        remitente: { in: remitenteOpuesto },
        leido: false,
      },
      data: { leido: true },
    })

    // Formatear respuesta
    const mensajesFormateados = mensajes.map(msg => ({
      id: msg.id,
      texto: msg.texto,
      remitente: msg.remitente,
      remitenteNombre: msg.usuario?.nombre || 'Sistema',
      fechaEnvio: msg.fechaEnvio.toISOString(),
      leido: msg.leido,
    }))

    return NextResponse.json({ mensajes: mensajesFormateados })
  } catch (error) {
    console.error('Error obteniendo mensajes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Enviar nuevo mensaje con posible adjunto
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { texto, expedienteId, archivoNombre, archivoContenido, archivoTipo } = body

    if (!texto || texto.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      )
    }

    let expId = expedienteId

    // Cliente envía a su expediente
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

    // Abogado envía a expediente asignado
    if (user.rol === 'abogado' && expedienteId) {
      const expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
      })
      if (!expediente || expediente.abogadoAsignadoId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Admin puede enviar a cualquier expediente
    if (user.rol === 'admin' && expedienteId) {
      expId = expedienteId
    }

    if (!expId) {
      return NextResponse.json(
        { error: 'Expediente no especificado' },
        { status: 400 }
      )
    }

    // Determinar remitente
    let remitente = 'cliente'
    if (user.rol === 'admin') remitente = 'admin'
    else if (user.rol === 'abogado') remitente = 'abogado'

    // Crear mensaje con o sin adjunto
    const mensaje = await prisma.mensaje.create({
      data: {
        expedienteId: expId,
        usuarioId: user.userId,
        remitente,
        texto: texto.trim(),
      },
      include: {
        usuario: {
          select: {
            nombre: true,
          },
        },
      },
    })

    // Si hay adjunto, guardarlo en MensajeDirecto (reutilizando la estructura)
    // O podríamos extender el modelo Mensaje para soportar adjuntos
    // Por ahora, guardamos el adjunto en una tabla separada si es necesario

    return NextResponse.json({ 
      success: true, 
      mensaje: {
        id: mensaje.id,
        texto: mensaje.texto,
        remitente: mensaje.remitente,
        remitenteNombre: mensaje.usuario?.nombre || user.nombre,
        fechaEnvio: mensaje.fechaEnvio.toISOString(),
        leido: mensaje.leido,
        archivoNombre: archivoNombre || null,
        archivoContenido: archivoContenido || null,
        archivoTipo: archivoTipo || null,
      }
    })
  } catch (error) {
    console.error('Error enviando mensaje:', error)
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    )
  }
}
