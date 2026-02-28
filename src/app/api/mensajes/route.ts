import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendNewMessageEmail } from '@/lib/email'

// GET - Listar mensajes del expediente con nombre del remitente y adjuntos
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

    // Obtener mensajes con información del remitente Y los adjuntos
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

    // Marcar mensajes recibidos como leídos según el destinatario
    // Un mensaje es "para mí" si:
    // - Soy cliente y el destinatario es 'cliente' o null (mensaje general)
    // - Soy abogado y el destinatario es 'abogado' o null
    // - Soy admin y el destinatario es 'admin' o null
    const destinatarioParaUsuario = user.rol
    
    await prisma.mensaje.updateMany({
      where: {
        expedienteId: expId,
        remitente: { not: user.rol },
        OR: [
          { destinatario: destinatarioParaUsuario },
          { destinatario: null }, // Mensajes generales sin destinatario específico
        ],
        leido: false,
      },
      data: { leido: true },
    })

    // Formatear respuesta INCLUYENDO los adjuntos y destinatario
    const mensajesFormateados = mensajes.map(msg => ({
      id: msg.id,
      texto: msg.texto,
      remitente: msg.remitente,
      remitenteNombre: msg.usuario?.nombre || 'Sistema',
      fechaEnvio: msg.fechaEnvio.toISOString(),
      leido: msg.leido,
      destinatario: msg.destinatario,
      archivoNombre: msg.archivoNombre,
      archivoContenido: msg.archivoContenido,
      archivoTipo: msg.archivoTipo,
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
    const { 
      texto, 
      expedienteId, 
      archivoNombre, 
      archivoContenido, 
      archivoTipo,
      destinatario // 'abogado', 'admin', 'cliente'
    } = body

    // Permitir mensajes vacíos SOLO si hay archivo adjunto
    if ((!texto || texto.trim().length === 0) && !archivoContenido) {
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
          cliente: { select: { id: true, nombre: true, email: true } },
          abogadoAsignado: { select: { id: true, nombre: true, email: true } },
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
          cliente: { select: { id: true, nombre: true, email: true } },
          abogadoAsignado: { select: { id: true, nombre: true, email: true } },
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
          cliente: { select: { id: true, nombre: true, email: true } },
          abogadoAsignado: { select: { id: true, nombre: true, email: true } },
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

    // Crear mensaje CON todos los campos incluyendo adjuntos y destinatario
    const mensaje = await prisma.mensaje.create({
      data: {
        expedienteId: expId,
        usuarioId: user.userId,
        remitente,
        destinatario: destinatario || null,
        texto: texto?.trim() || '',
        archivoNombre: archivoNombre || null,
        archivoContenido: archivoContenido || null,
        archivoTipo: archivoTipo || null,
      },
      include: {
        usuario: {
          select: {
            nombre: true,
          },
        },
      },
    })

    // Enviar email de notificación al destinatario correspondiente
    try {
      const remitenteNombre = user.nombre
      
      if (user.rol === 'cliente') {
        // Cliente elige a quién notificar
        if (destinatario === 'admin') {
          // Notificar a administración - obtener admin(s)
          const admins = await prisma.usuario.findMany({
            where: { rol: 'admin', activo: true },
            select: { email: true, nombre: true }
          })
          
          for (const admin of admins) {
            await sendNewMessageEmail(
              admin.email,
              admin.nombre,
              remitenteNombre,
              texto?.trim() || 'Archivo adjunto',
              expediente.referencia
            )
          }
        } else {
          // Por defecto notificar al abogado asignado
          if (expediente.abogadoAsignado?.email) {
            await sendNewMessageEmail(
              expediente.abogadoAsignado.email,
              expediente.abogadoAsignado.nombre,
              remitenteNombre,
              texto?.trim() || 'Archivo adjunto',
              expediente.referencia
            )
          } else {
            // Si no hay abogado asignado, notificar a admin
            const admins = await prisma.usuario.findMany({
              where: { rol: 'admin', activo: true },
              select: { email: true, nombre: true }
            })
            
            for (const admin of admins) {
              await sendNewMessageEmail(
                admin.email,
                admin.nombre,
                remitenteNombre,
                texto?.trim() || 'Archivo adjunto',
                expediente.referencia
              )
            }
          }
        }
      } else if (user.rol === 'abogado') {
        // Abogado elige a quién notificar
        if (destinatario === 'admin') {
          const admins = await prisma.usuario.findMany({
            where: { rol: 'admin', activo: true },
            select: { email: true, nombre: true }
          })
          
          for (const admin of admins) {
            await sendNewMessageEmail(
              admin.email,
              admin.nombre,
              remitenteNombre,
              texto?.trim() || 'Archivo adjunto',
              expediente.referencia
            )
          }
        } else {
          // Notificar al cliente
          if (expediente.cliente?.email) {
            await sendNewMessageEmail(
              expediente.cliente.email,
              expediente.cliente.nombre,
              remitenteNombre,
              texto?.trim() || 'Archivo adjunto',
              expediente.referencia
            )
          }
        }
      } else if (user.rol === 'admin') {
        // Admin puede notificar a cliente o abogado según destinatario
        if (destinatario === 'abogado' && expediente.abogadoAsignado?.email) {
          await sendNewMessageEmail(
            expediente.abogadoAsignado.email,
            expediente.abogadoAsignado.nombre,
            'Administración',
            texto?.trim() || 'Archivo adjunto',
            expediente.referencia
          )
        } else if (expediente.cliente?.email) {
          // Por defecto notificar al cliente
          await sendNewMessageEmail(
            expediente.cliente.email,
            expediente.cliente.nombre,
            'Administración',
            texto?.trim() || 'Archivo adjunto',
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
        destinatario: mensaje.destinatario,
        archivoNombre: mensaje.archivoNombre,
        archivoContenido: mensaje.archivoContenido,
        archivoTipo: mensaje.archivoTipo,
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
