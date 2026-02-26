import { NextRequest, NextResponse } from 'next/server'
import { withAbogadoOrAdminAuth, withAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Enviar email/notificación
export async function POST(request: NextRequest) {
  return withAbogadoOrAdminAuth(request, async (user) => {
    try {
      const body = await request.json()
      const { 
        to, 
        subject, 
        message,
        expedienteId,
        tipo = 'notificacion'
      } = body

      if (!to || !subject || !message) {
        return NextResponse.json({ 
          error: 'to, subject y message son requeridos' 
        }, { status: 400 })
      }

      // En producción, aquí se integraría con un servicio de email
      // como SendGrid, Resend, AWS SES, etc.
      // Por ahora, registramos en el audit log como notificación enviada
      
      if (expedienteId) {
        // Verificar acceso al expediente
        const expediente = await prisma.expediente.findUnique({
          where: { id: expedienteId }
        })

        if (!expediente) {
          return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
        }

        if (user.rol === 'abogado' && expediente.abogadoAsignadoId !== user.userId) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        // Registrar en audit log
        await prisma.auditLog.create({
          data: {
            usuarioId: user.userId,
            expedienteId,
            accion: 'enviar_email',
            descripcion: `Email enviado a ${to}: ${subject}`,
            datos: JSON.stringify({ to, subject, message: message.substring(0, 500), tipo })
          }
        })
      }

      // Log del email para desarrollo
      console.log('📧 Email enviado:', {
        to,
        subject,
        message: message.substring(0, 100) + '...',
        enviadoPor: user.email,
        expedienteId,
        tipo
      })

      // TODO: Integrar con servicio de email real
      // Ejemplo con Resend:
      // const { data, error } = await resend.emails.send({
      //   from: 'DeudasACero <noreply@deudasacero.es>',
      //   to,
      //   subject,
      //   html: message,
      // })

      return NextResponse.json({ 
        message: 'Email enviado correctamente',
        email: {
          to,
          subject,
          enviadoPor: user.email,
          estado: 'enviado'
        }
      })
    } catch (error) {
      console.error('Error al enviar email:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  })
}

// GET - Obtener historial de notificaciones
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const expedienteId = searchParams.get('expedienteId')
      
      // Solo admin y abogados pueden ver el historial completo
      if (user.rol === 'cliente') {
        return NextResponse.json({ 
          emails: [],
          message: 'Los clientes no tienen acceso al historial de emails'
        })
      }

      let where: any = { accion: 'enviar_email' }
      
      if (expedienteId) {
        where.expedienteId = expedienteId
      }

      if (user.rol === 'abogado') {
        // Abogados solo ven emails de sus expedientes
        const expedientesAsignados = await prisma.expediente.findMany({
          where: { abogadoAsignadoId: user.userId },
          select: { id: true }
        })
        const ids = expedientesAsignados.map(e => e.id)
        where.expedienteId = { in: ids }
      }

      const emails = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true }
          }
        }
      })

      // Parsear datos del email
      const emailsParsed = emails.map(e => ({
        ...e,
        datos: e.datos ? JSON.parse(e.datos) : null
      }))

      return NextResponse.json({ emails: emailsParsed })
    } catch (error) {
      console.error('Error al obtener emails:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  })
}
