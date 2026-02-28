import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener/descargar una factura específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true }
        },
        expediente: {
          select: { id: true, referencia: true, clienteId: true }
        }
      }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // Verificar permisos
    if (user.rol === 'cliente') {
      // Cliente solo puede ver sus propias facturas
      if (factura.usuarioId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    } else if (user.rol === 'abogado') {
      // Abogado puede ver facturas de sus expedientes
      if (factura.expediente) {
        const expediente = await prisma.expediente.findUnique({
          where: { id: factura.expediente.id }
        })
        if (expediente?.abogadoAsignadoId !== user.userId) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }
      }
    }
    // Admin puede ver todas

    return NextResponse.json({ factura })
  } catch (error) {
    console.error('Error obteniendo factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado de factura (confirmar pago, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || (user.rol !== 'admin' && user.rol !== 'abogado')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { estado, notas, metodoPago } = body

    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        expediente: {
          select: { id: true, abogadoAsignadoId: true }
        }
      }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // Verificar permisos para abogado
    if (user.rol === 'abogado' && factura.expediente) {
      if (factura.expediente.abogadoAsignadoId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Actualizar la factura
    const facturaActualizada = await prisma.factura.update({
      where: { id },
      data: {
        ...(estado && { estado }),
        ...(notas !== undefined && { notas }),
        updatedAt: new Date(),
      },
    })

    // Si se marca como pagada, actualizar el sistema de pagos
    if (estado === 'pagada' && factura.expedienteId) {
      // Buscar el registro de facturación del expediente
      const facturacion = await prisma.facturacion.findUnique({
        where: { expedienteId: factura.expedienteId }
      })

      if (facturacion) {
        // Buscar el pago pendiente asociado a esta factura (por concepto)
        const pagoPendiente = await prisma.pago.findFirst({
          where: {
            facturacionId: facturacion.id,
            concepto: { contains: factura.numero },
            estado: 'pendiente'
          }
        })

        if (pagoPendiente) {
          // Actualizar el pago existente a pagado
          await prisma.pago.update({
            where: { id: pagoPendiente.id },
            data: {
              estado: 'pagado',
              metodoPago: metodoPago || 'transferencia',
              fechaPago: new Date(),
              notas: `Pago confirmado - Factura ${factura.numero}`
            }
          })
        } else {
          // Si no existe pago pendiente, crear uno pagado
          await prisma.pago.create({
            data: {
              facturacionId: facturacion.id,
              concepto: `Pago factura ${factura.numero} - ${factura.concepto}`,
              importe: factura.importe,
              estado: 'pagado',
              metodoPago: metodoPago || 'transferencia',
              fechaPago: new Date(),
              notas: `Pago confirmado desde factura ${factura.numero}`,
            }
          })
        }

        // Recalcular el total facturado
        const pagosCompletados = await prisma.pago.aggregate({
          where: {
            facturacionId: facturacion.id,
            estado: 'pagado'
          },
          _sum: { importe: true }
        })

        const totalPagado = pagosCompletados._sum.importe || 0

        // Actualizar estado de facturación
        let nuevoEstado = 'pendiente'
        if (totalPagado >= facturacion.importePresupuestado) {
          nuevoEstado = 'pagado'
        } else if (totalPagado > 0) {
          nuevoEstado = 'parcial'
        }

        await prisma.facturacion.update({
          where: { id: facturacion.id },
          data: {
            importeFacturado: totalPagado,
            estado: nuevoEstado,
            metodoPago: metodoPago || facturacion.metodoPago,
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      factura: facturaActualizada 
    })
  } catch (error) {
    console.error('Error actualizando factura:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la factura' },
      { status: 500 }
    )
  }
}

// DELETE - Anular factura
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params

    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        expediente: true
      }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // Si la factura tiene expediente, eliminar el pago pendiente asociado y actualizar facturación
    if (factura.expedienteId) {
      const facturacion = await prisma.facturacion.findUnique({
        where: { expedienteId: factura.expedienteId }
      })

      if (facturacion) {
        // Buscar y eliminar el pago pendiente asociado a esta factura
        const pagoPendiente = await prisma.pago.findFirst({
          where: {
            facturacionId: facturacion.id,
            concepto: { contains: factura.numero },
            estado: 'pendiente'
          }
        })

        if (pagoPendiente) {
          await prisma.pago.delete({
            where: { id: pagoPendiente.id }
          })
        }

        // Actualizar el importe presupuestado (restar el importe de la factura anulada)
        const nuevoImportePresupuestado = Math.max(0, facturacion.importePresupuestado - factura.importe)
        
        // Recalcular el estado de la facturación
        const pagosCompletados = await prisma.pago.aggregate({
          where: {
            facturacionId: facturacion.id,
            estado: 'pagado'
          },
          _sum: { importe: true }
        })

        const totalPagado = pagosCompletados._sum.importe || 0
        let nuevoEstado = 'pendiente'
        
        if (nuevoImportePresupuestado === 0) {
          nuevoEstado = 'pendiente'
        } else if (totalPagado >= nuevoImportePresupuestado) {
          nuevoEstado = 'pagado'
        } else if (totalPagado > 0) {
          nuevoEstado = 'parcial'
        }

        await prisma.facturacion.update({
          where: { id: facturacion.id },
          data: {
            importePresupuestado: nuevoImportePresupuestado,
            estado: nuevoEstado,
          }
        })
      }
    }

    // Marcar factura como anulada
    await prisma.factura.update({
      where: { id },
      data: { estado: 'anulada' }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Factura anulada correctamente. Se ha eliminado el pago pendiente asociado.' 
    })
  } catch (error) {
    console.error('Error anulando factura:', error)
    return NextResponse.json(
      { error: 'Error al anular la factura' },
      { status: 500 }
    )
  }
}
