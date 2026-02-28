import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
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
          facturacion: true,
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
  })
}
