import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canAccessExpediente, withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener expediente del usuario autenticado
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Cliente ve su propio expediente
    if (user.rol === 'cliente') {
      const expediente = await prisma.expediente.findFirst({
        where: { clienteId: user.userId },
        include: {
          cliente: {
            select: { id: true, nombre: true, email: true, nif: true, telefono: true }
          },
          deudas: true,
          documentos: {
            where: { esJudicial: false },
            orderBy: { createdAt: 'desc' },
          },
          documentosJudiciales: {
            orderBy: { fechaSubida: 'desc' },
          },
          mensajes: {
            orderBy: { fechaEnvio: 'desc' },
            take: 5,
          },
          abogadoAsignado: {
            select: { nombre: true },
          },
          checklist: {
            orderBy: { orden: 'asc' },
          },
        },
      })

      if (!expediente) {
        return NextResponse.json({ expediente: null })
      }

      const deudaTotal = expediente.deudas.reduce((sum, d) => sum + d.importe, 0)
      const deudaPublica = expediente.deudas
        .filter((d) => d.tipo === 'publica')
        .reduce((sum, d) => sum + d.importe, 0)
      const deudaFinanciera = expediente.deudas
        .filter((d) => d.tipo === 'financiera')
        .reduce((sum, d) => sum + d.importe, 0)

      return NextResponse.json({
        expediente: {
          ...expediente,
          usuario: expediente.cliente, // Mapear cliente a usuario para el frontend
          abogadoAsignadoObj: expediente.abogadoAsignado, // Mapear para el frontend
          deudaTotal,
          deudaPublica,
          deudaFinanciera,
          estimacionExoneracion: deudaTotal * 0.85,
        },
      })
    }

    // Admin ve todos los expedientes (resumen)
    if (user.rol === 'admin') {
      const expedientes = await prisma.expediente.findMany({
        include: {
          cliente: { select: { nombre: true, email: true } },
          abogadoAsignado: { select: { nombre: true } },
          deudas: true,
          documentos: true,
          mensajes: { where: { leido: false, remitente: 'cliente' } },
        },
        orderBy: { updatedAt: 'desc' },
      })

      return NextResponse.json({
        expedientes: expedientes.map((exp) => ({
          ...exp,
          deudaTotal: exp.deudas.reduce((sum, d) => sum + d.importe, 0),
          documentosPendientes: exp.documentos.filter((d) => d.estado === 'pendiente').length,
          mensajesNuevos: exp.mensajes.length,
        })),
      })
    }

    return NextResponse.json({ expediente: null })
  } catch (error) {
    console.error('Error obteniendo expediente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar expediente (solo admin)
export async function PATCH(request: NextRequest) {
  return withAdminAuth(request, async (user) => {
    try {
      const body = await request.json()
      const {
        id,
        faseActual,
        porcentajeAvance,
        notasInternas,
        abogadoAsignadoId,
        estado,
      } = body

      if (!id) {
        return NextResponse.json(
          { error: 'ID de expediente requerido' },
          { status: 400 }
        )
      }

      const updateData: any = {}
      if (faseActual !== undefined) updateData.faseActual = faseActual
      if (porcentajeAvance !== undefined) updateData.porcentajeAvance = porcentajeAvance
      if (notasInternas !== undefined) updateData.notasInternas = notasInternas
      if (abogadoAsignadoId !== undefined) updateData.abogadoAsignadoId = abogadoAsignadoId
      if (estado !== undefined) updateData.estado = estado

      const expediente = await prisma.expediente.update({
        where: { id },
        data: updateData,
      })

      // Registrar en audit log
      await prisma.auditLog.create({
        data: {
          usuarioId: user.userId,
          expedienteId: id,
          accion: 'actualizar_expediente',
          descripcion: `Actualizado expediente ${expediente.referencia}`,
          datos: JSON.stringify(updateData),
        },
      })

      return NextResponse.json({ success: true, expediente })
    } catch (error) {
      console.error('Error actualizando expediente:', error)
      return NextResponse.json(
        { error: 'Error al actualizar expediente' },
        { status: 500 }
      )
    }
  })
}
