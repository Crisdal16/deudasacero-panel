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

    console.log(`[ANULAR] Anulando factura ${factura.numero} (ID: ${factura.id}), importe: ${factura.importe}`)

    let pagoEliminado = false
    let facturacionActualizada = false

    // Si la factura tiene expediente, eliminar el pago pendiente asociado y actualizar facturación
    if (factura.expedienteId) {
      const facturacion = await prisma.facturacion.findUnique({
        where: { expedienteId: factura.expedienteId }
      })

      if (facturacion) {
        console.log(`[ANULAR] Buscando pago pendiente para facturacionId: ${facturacion.id}, numero factura: ${factura.numero}`)

        // Buscar el pago pendiente asociado a esta factura
        // Buscar por concepto que contenga el número de factura (formato: "Factura F2024-XXXX - concepto")
        // También buscar si el concepto es exactamente el número de factura
        const pagoPendiente = await prisma.pago.findFirst({
          where: {
            facturacionId: facturacion.id,
            estado: 'pendiente',
            OR: [
              { concepto: { contains: factura.numero } },
              { concepto: { contains: `Factura ${factura.numero}` } },
            ]
          }
        })

        if (pagoPendiente) {
          console.log(`[ANULAR] Eliminando pago pendiente ID: ${pagoPendiente.id}, concepto: ${pagoPendiente.concepto}`)
          await prisma.pago.delete({
            where: { id: pagoPendiente.id }
          })
          pagoEliminado = true
        } else {
          console.log(`[ANULAR] No se encontró pago pendiente para la factura ${factura.numero}`)
          // Listar todos los pagos pendientes para debug
          const todosPendientes = await prisma.pago.findMany({
            where: {
              facturacionId: facturacion.id,
              estado: 'pendiente'
            }
          })
          console.log(`[ANULAR] Pagos pendientes existentes:`, todosPendientes.map(p => ({ id: p.id, concepto: p.concepto, importe: p.importe })))
        }

        // Actualizar el importe presupuestado (restar el importe de la factura anulada)
        const nuevoImportePresupuestado = Math.max(0, facturacion.importePresupuestado - factura.importe)
        
        // Recalcular el total pagado y el estado de la facturación
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

        console.log(`[ANULAR] Actualizando facturación - nuevo presupuesto: ${nuevoImportePresupuestado}, total pagado: ${totalPagado}, nuevo estado: ${nuevoEstado}`)

        await prisma.facturacion.update({
          where: { id: facturacion.id },
          data: {
            importePresupuestado: nuevoImportePresupuestado,
            importeFacturado: totalPagado,
            estado: nuevoEstado,
          }
        })
        facturacionActualizada = true
      } else {
        console.log(`[ANULAR] No se encontró registro de facturación para expedienteId: ${factura.expedienteId}`)
      }
    } else {
      console.log(`[ANULAR] La factura no tiene expedienteId asociado`)
    }

    // Marcar factura como anulada
    await prisma.factura.update({
      where: { id },
      data: { estado: 'anulada' }
    })

    console.log(`[ANULAR] Factura ${factura.numero} anulada correctamente`)

    return NextResponse.json({ 
      success: true, 
      message: 'Factura anulada correctamente',
      detalles: {
        facturaAnulada: factura.numero,
        pagoPendienteEliminado: pagoEliminado,
        facturacionActualizada: facturacionActualizada
      }
    })
  } catch (error) {
    console.error('Error anulando factura:', error)
    return NextResponse.json(
      { error: 'Error al anular la factura' },
      { status: 500 }
    )
  }
}
