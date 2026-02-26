import { NextRequest, NextResponse } from 'next/server'
import { withAbogadoOrAdminAuth, getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Listar expedientes del abogado asignado
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Admin ve todos los expedientes
  if (user.rol === 'admin') {
    try {
      const expedientes = await prisma.expediente.findMany({
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true,
              nif: true,
            },
          },
          abogadoAsignado: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          deudas: true,
          documentos: {
            where: { esJudicial: false },
          },
          mensajes: {
            where: { leido: false, remitente: 'cliente' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const expedientesConInfo = expedientes.map((exp) => ({
        ...exp,
        deudaTotal: exp.deudas.reduce((sum, d) => sum + d.importe, 0),
        documentosPendientes: exp.documentos.filter((d) => d.estado === 'pendiente').length,
        mensajesNuevos: exp.mensajes.length,
      }))

      return NextResponse.json({ expedientes: expedientesConInfo })
    } catch (error) {
      console.error('Error obteniendo expedientes:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  // Abogado solo ve sus expedientes asignados
  if (user.rol === 'abogado') {
    try {
      const expedientes = await prisma.expediente.findMany({
        where: {
          abogadoAsignadoId: user.userId,
          estado: 'activo',
        },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true,
              nif: true,
            },
          },
          deudas: true,
          documentos: {
            where: { esJudicial: false },
          },
          mensajes: {
            where: { leido: false, remitente: 'cliente' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      const expedientesConInfo = expedientes.map((exp) => ({
        ...exp,
        deudaTotal: exp.deudas.reduce((sum, d) => sum + d.importe, 0),
        documentosPendientes: exp.documentos.filter((d) => d.estado === 'pendiente').length,
        mensajesNuevos: exp.mensajes.length,
      }))

      return NextResponse.json({ expedientes: expedientesConInfo })
    } catch (error) {
      console.error('Error obteniendo expedientes del abogado:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
}
