import { NextRequest, NextResponse } from 'next/server'
import { withAbogadoOrAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PATCH - Actualizar estado de pago (marcar como pagado, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAbogadoOrAdminAuth(request, async (user) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { estado, metodoPago, fechaPago, notas } = body

      if (!estado && !metodoPago && !fechaPago && !notas) {
        return NextResponse.json({ error: 'Al menos un campo a actualizar es requerido' }, { status: 400 })
      }

      // Verificar acceso al pago
      const pago = await prisma.pago.findUnique({
        where: { id },
        include: { 
          facturacion: { 
            include: { expediente: true } 
          } 
        }
      })

      if (!pago) {
        return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
      }

      if (user.rol === 'abogado' && pago.facturacion.expediente.abogadoAsignadoId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      // Actualizar el pago
      const pagoActualizado = await prisma.pago.update({
        where: { id },
        data: { 
          ...(estado && { estado }),
          ...(metodoPago && { metodoPago }),
          ...(fechaPago && { fechaPago: new Date(fechaPago) }),
          ...(notas !== undefined && { notas })
        },
        include: {
          facturacion: {
            include: {
              expediente: {
                select: { 
                  id: true, 
                  referencia: true,
                  cliente: { select: { id: true, nombre: true, email: true } }
                }
              }
            }
          }
        }
      })

      // Si se marca como pagado, actualizar el total facturado
      if (estado === 'pagado') {
        const pagosCompletados = await prisma.pago.aggregate({
          where: { 
            facturacionId: pago.facturacionId,
            estado: 'pagado'
          },
          _sum: { importe: true }
        })

        const totalPagado = (pagosCompletados._sum.importe || 0) + pago.importe

        // Actualizar estado de facturación
        let nuevoEstadoFacturacion = 'parcial'
        if (totalPagado >= pago.facturacion.importePresupuestado) {
          nuevoEstadoFacturacion = 'pagado'
        }

        await prisma.facturacion.update({
          where: { id: pago.facturacionId },
          data: { 
            importeFacturado: totalPagado,
            estado: nuevoEstadoFacturacion
          }
        })
      }

      return NextResponse.json({ 
        message: 'Pago actualizado correctamente',
        pago: pagoActualizado 
      })
    } catch (error) {
      console.error('Error al actualizar pago:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  })
}

// DELETE - Eliminar pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAbogadoOrAdminAuth(request, async (user) => {
    try {
      const { id } = await params

      // Verificar acceso al pago
      const pago = await prisma.pago.findUnique({
        where: { id },
        include: { 
          facturacion: { 
            include: { expediente: true } 
          } 
        }
      })

      if (!pago) {
        return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
      }

      if (user.rol === 'abogado' && pago.facturacion.expediente.abogadoAsignadoId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      // Eliminar el pago
      await prisma.pago.delete({ where: { id } })

      // Recalcular total facturado
      const pagosCompletados = await prisma.pago.aggregate({
        where: { 
          facturacionId: pago.facturacionId,
          estado: 'pagado'
        },
        _sum: { importe: true }
      })

      const totalPagado = pagosCompletados._sum.importe || 0

      // Actualizar estado de facturación
      const facturacion = await prisma.facturacion.findUnique({
        where: { id: pago.facturacionId }
      })

      if (facturacion) {
        let nuevoEstado = 'pendiente'
        if (totalPagado > 0 && totalPagado < facturacion.importePresupuestado) {
          nuevoEstado = 'parcial'
        } else if (totalPagado >= facturacion.importePresupuestado) {
          nuevoEstado = 'pagado'
        }

        await prisma.facturacion.update({
          where: { id: pago.facturacionId },
          data: { 
            importeFacturado: totalPagado,
            estado: nuevoEstado
          }
        })
      }

      return NextResponse.json({ 
        message: 'Pago eliminado correctamente'
      })
    } catch (error) {
      console.error('Error al eliminar pago:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  })
}
