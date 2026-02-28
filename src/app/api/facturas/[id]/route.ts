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
      // Buscar o crear el registro de facturación del expediente
      let facturacion = await prisma.facturacion.findUnique({
        where: { expedienteId: factura.expedienteId }
      })

      if (!facturacion) {
        // Crear registro de facturación si no existe
        facturacion = await prisma.facturacion.create({
          data: {
            expedienteId: factura.expedienteId,
            importePresupuestado: factura.importe,
            importeFacturado: factura.importe,
            estado: 'pagado',
            metodoPago: metodoPago || 'transferencia',
          }
        })
      } else {
        // Actualizar el registro de facturación existente
        const totalFacturado = facturacion.importeFacturado + factura.importe
        let nuevoEstado = facturacion.estado
        
        if (totalFacturado >= facturacion.importePresupuestado) {
          nuevoEstado = 'pagado'
        } else if (totalFacturado > 0) {
          nuevoEstado = 'parcial'
        }

        await prisma.facturacion.update({
          where: { id: facturacion.id },
          data: {
            importeFacturado: totalFacturado,
            estado: nuevoEstado,
            metodoPago: metodoPago || facturacion.metodoPago,
          }
        })
      }

      // Crear registro de pago asociado
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
      where: { id }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // Marcar como anulada en lugar de eliminar
    await prisma.factura.update({
      where: { id },
      data: { estado: 'anulada' }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Factura anulada correctamente' 
    })
  } catch (error) {
    console.error('Error anulando factura:', error)
    return NextResponse.json(
      { error: 'Error al anular la factura' },
      { status: 500 }
    )
  }
}
