import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
          descripcion: `Fase cambiada a ${fase} (${porcentajeAvance}% de progreso)`,
        },
      })

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
