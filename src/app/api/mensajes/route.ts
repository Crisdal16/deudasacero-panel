import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendNewMessageEmail } from '@/lib/email'

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
    let expediente: any = null

    // Cliente envía a su expediente
    if (user.rol === 'cliente') {
      expediente = await prisma.expediente.findUnique({
        where: { clienteId: user.userId },
        include: {
          cliente: { select: { nombre: true, email: true } },
          abogadoAsignado: { select: { nombre: true, email: true } },
        },
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
      expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
        include: {
          cliente: { select: { nombre: true, email: true } },
          abogadoAsignado: { select: { nombre: true, email: true } },
        },
      })
      if (!expediente || expediente.abogadoAsignadoId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Admin puede enviar a cualquier expediente
    if (user.rol === 'admin' && expedienteId) {
      expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
        include: {
          cliente: { select: { nombre: true, email: true } },
          abogadoAsignado: { select: { nombre: true, email: true } },
        },
      })
      expId = expedienteId
    }

    if (!expId || !expediente) {
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

    // Guardar adjunto si existe (en MensajeDirecto o actualizar el mensaje)
    // Por ahora devolvemos el adjunto en la respuesta para que el frontend lo maneje
    // En una implementación completa, se guardaría en una tabla de adjuntos

    // Enviar email de notificación al destinatario correspondiente
    try {
      const remitenteNombre = user.nombre
      
      if (user.rol === 'cliente') {
        // Notificar al abogado asignado si existe, si no al admin
        if (expediente.abogadoAsignado?.email) {
          await sendNewMessageEmail(
            expediente.abogadoAsignado.email,
            expediente.abogadoAsignado.nombre,
            remitenteNombre,
            texto.trim(),
            expediente.referencia
          )
        }
        // También notificar a la administración (admin principal)
        // Podríamos tener un email de admin en las variables de entorno
      } else if (user.rol === 'abogado') {
        // Notificar al cliente
        if (expediente.cliente?.email) {
          await sendNewMessageEmail(
            expediente.cliente.email,
            expediente.cliente.nombre,
            remitenteNombre,
            texto.trim(),
            expediente.referencia
          )
        }
      } else if (user.rol === 'admin') {
        // Notificar al cliente
        if (expediente.cliente?.email) {
          await sendNewMessageEmail(
            expediente.cliente.email,
            expediente.cliente.nombre,
            'Administración',
            texto.trim(),
            expediente.referencia
          )
        }
      }
    } catch (emailError) {
      console.error('Error enviando notificación de mensaje:', emailError)
      // No fallar el envío del mensaje si el email falla
    }

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
