import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Listar mensajes del expediente
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

    if (!expId) {
      return NextResponse.json({ mensajes: [] })
    }

    const mensajes = await prisma.mensaje.findMany({
      where: { expedienteId: expId },
      orderBy: { fechaEnvio: 'asc' },
    })

    // Marcar mensajes recibidos como leídos
    const remitente = user.rol === 'cliente' ? 'despacho' : 'cliente'
    await prisma.mensaje.updateMany({
      where: {
        expedienteId: expId,
        remitente,
        leido: false,
      },
      data: { leido: true },
    })

    return NextResponse.json({ mensajes })
  } catch (error) {
    console.error('Error obteniendo mensajes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Enviar nuevo mensaje
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { texto, expedienteId } = body

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

    const mensaje = await prisma.mensaje.create({
      data: {
        expedienteId: expId,
        usuarioId: user.userId,
        remitente,
        texto: texto.trim(),
      },
    })

    return NextResponse.json({ success: true, mensaje })
  } catch (error) {
    console.error('Error enviando mensaje:', error)
    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    )
  }
}
