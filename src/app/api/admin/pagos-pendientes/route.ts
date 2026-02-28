import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener resumen de pagos pendientes para el panel de admin
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener todas las facturaciones con sus pagos
    const facturaciones = await prisma.facturacion.findMany({
      include: {
        expediente: {
          select: {
            id: true,
            referencia: true,
            cliente: {
              select: {
                id: true,
                nombre: true,
                email: true,
              }
            }
          }
        },
        pagos: true
      }
    })

    // Calcular pendientes por expediente
    const pagosPendientes = facturaciones.map(f => {
      const pagosPendientesArr = f.pagos.filter(p => p.estado === 'pendiente')
      const totalPendiente = pagosPendientesArr.reduce((sum, p) => sum + p.importe, 0)
      return {
        expedienteId: f.expedienteId,
        referencia: f.expediente.referencia,
        cliente: f.expediente.cliente,
        totalPendiente,
        cantidadPagos: pagosPendientesArr.length,
        estadoFacturacion: f.estado,
        importePresupuestado: f.importePresupuestado,
        importeFacturado: f.importeFacturado,
      }
    }).filter(p => p.totalPendiente > 0)

    // Calcular total general
    const totalGeneral = pagosPendientes.reduce((sum, p) => sum + p.totalPendiente, 0)

    // Obtener facturas emitidas pendientes de pago
    const facturasPendientes = await prisma.factura.findMany({
      where: {
        estado: 'emitida'
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        },
        expediente: {
          select: {
            id: true,
            referencia: true,
          }
        }
      },
      orderBy: { fechaEmision: 'desc' }
    })

    const totalFacturasPendientes = facturasPendientes.reduce((sum, f) => sum + f.importe, 0)

    return NextResponse.json({
      pagosPendientes,
      totalGeneral,
      facturasPendientes,
      totalFacturasPendientes,
      resumen: {
        expedientesConPagosPendientes: pagosPendientes.length,
        totalPagosPendientes: totalGeneral,
        facturasPendientes: facturasPendientes.length,
        totalFacturasPendientes,
      }
    })
  } catch (error) {
    console.error('Error obteniendo pagos pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
