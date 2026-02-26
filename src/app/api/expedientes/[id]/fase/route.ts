import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendPhaseChangeEmail } from '@/lib/email'

// Nombres y descripciones de las fases
const fasesInfo: Record<number, { nombre: string; descripcion: string }> = {
  1: {
    nombre: 'Inicio del expediente',
    descripcion: 'Se ha iniciado tu expediente de Ley de Segunda Oportunidad. Pronto comenzaremos con la recopilación de documentación.'
  },
  2: {
    nombre: 'Presupuesto y hoja de encargo',
    descripcion: 'Te hemos enviado el presupuesto y la hoja de encargo. Por favor, revísalo y firma para continuar.'
  },
  3: {
    nombre: 'Recopilación de documentación',
    descripcion: 'Es necesario recopilar toda la documentación obligatoria para presentar tu demanda. Sube los documentos a través del portal.'
  },
  4: {
    nombre: 'Presentación de concurso consecutivo',
    descripcion: 'Hemos presentado la demanda de concurso consecutivo ante el juzgado correspondiente.'
  },
  5: {
    nombre: 'Auto de declaración de concurso',
    descripcion: 'El juez ha dictado el auto de declaración de concurso. Ya eres oficialmente concursado.'
  },
  6: {
    nombre: 'Fase de liquidación',
    descripcion: 'Se está procediendo a la liquidación del patrimonio disponible para el pago a acreedores.'
  },
  7: {
    nombre: 'Informe de administración concursal',
    descripcion: 'El administrador concursal ha emitido su informe sobre tu situación patrimonial.'
  },
  8: {
    nombre: 'Audiencia con los acreedores',
    descripcion: 'Se ha celebrado la audiencia con los acreedores para presentar las propuestas de pago.'
  },
  9: {
    nombre: 'Auto de exoneración',
    descripcion: 'El juez ha dictado el auto de exoneración. ¡Estás cada vez más cerca del final!'
  },
  10: {
    nombre: 'Resolución y fin del procedimiento',
    descripcion: '¡Felicidades! Tu procedimiento de Ley de Segunda Oportunidad ha finalizado. Has obtenido la exoneración de tus deudas.'
  }
}

// Cambiar fase de un expediente (solo admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (user) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { fase } = body

      if (!fase || fase < 1 || fase > 10) {
        return NextResponse.json(
          { error: 'Fase inválida. Debe ser un número entre 1 y 10' },
          { status: 400 }
        )
      }

      // Obtener expediente actual para saber la fase anterior
      const expedienteActual = await prisma.expediente.findUnique({
        where: { id },
        include: {
          cliente: {
            select: { nombre: true, email: true }
          }
        }
      })

      if (!expedienteActual) {
        return NextResponse.json(
          { error: 'Expediente no encontrado' },
          { status: 404 }
        )
      }

      const faseAnterior = expedienteActual.faseActual

      // Calcular porcentaje de avance automáticamente
      const porcentajeAvance = Math.round((fase / 10) * 100)

      const expediente = await prisma.expediente.update({
        where: { id },
        data: {
          faseActual: fase,
          porcentajeAvance,
          // Si llega a fase 10, cerrar expediente
          ...(fase === 10 && {
            estado: 'cerrado',
            fechaCierre: new Date(),
          }),
        },
        include: {
          cliente: {
            select: { nombre: true, email: true },
          },
        },
      })

      // Crear entrada en audit log
      await prisma.auditLog.create({
        data: {
          usuarioId: user.userId,
          expedienteId: id,
          accion: 'cambiar_fase',
          descripcion: `Fase cambiada de ${faseAnterior} a ${fase} (${porcentajeAvance}% de progreso)`,
        },
      })

      // Enviar email al cliente
      if (expediente.cliente?.email && fasesInfo[fase]) {
        try {
          await sendPhaseChangeEmail(
            expediente.cliente.email,
            expediente.cliente.nombre,
            faseAnterior,
            fase,
            fasesInfo[fase].nombre,
            fasesInfo[fase].descripcion,
            expediente.referencia
          )
        } catch (emailError) {
          console.error('Error enviando email de cambio de fase:', emailError)
          // No fallar el cambio de fase si el email falla
        }
      }

      return NextResponse.json({
        success: true,
        expediente,
        message: `Fase actualizada a ${fase}. Progreso: ${porcentajeAvance}%`,
      })
    } catch (error) {
      console.error('Error al cambiar fase:', error)
      return NextResponse.json(
        { error: 'Error al actualizar la fase' },
        { status: 500 }
      )
    }
  })
}
