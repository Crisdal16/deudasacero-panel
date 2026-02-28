import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH - Asignar/desasignar abogado a un expediente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (user) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { abogadoId } = body

      // Verificar que el expediente existe
      const expediente = await prisma.expediente.findUnique({
        where: { id },
      })

      if (!expediente) {
        return NextResponse.json(
          { error: 'Expediente no encontrado' },
          { status: 404 }
        )
      }

      // Si se proporciona abogadoId, verificar que existe y es abogado
      if (abogadoId) {
        const abogado = await prisma.usuario.findUnique({
          where: { id: abogadoId },
        })

        if (!abogado || abogado.rol !== 'abogado') {
          return NextResponse.json(
            { error: 'Abogado no encontrado o no válido' },
            { status: 400 }
          )
        }
      }

      // Actualizar expediente
      const expedienteActualizado = await prisma.expediente.update({
        where: { id },
        data: { abogadoAsignadoId: abogadoId || null },
        include: {
          cliente: {
            select: { nombre: true, email: true },
          },
          abogadoAsignado: {
            select: { nombre: true, email: true },
          },
        },
      })

      // Registrar en audit log
      await prisma.auditLog.create({
        data: {
          usuarioId: user.userId,
          expedienteId: id,
          accion: abogadoId ? 'asignar_abogado' : 'desasignar_abogado',
          descripcion: abogadoId
            ? `Asignado abogado al expediente ${expediente.referencia}`
            : `Desasignado abogado del expediente ${expediente.referencia}`,
        },
      })

      return NextResponse.json({ expediente: expedienteActualizado })
    } catch (error) {
      console.error('Error asignando abogado:', error)
      return NextResponse.json(
        { error: 'Error al asignar abogado' },
        { status: 500 }
      )
    }
  })
}
