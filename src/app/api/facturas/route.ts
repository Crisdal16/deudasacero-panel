import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Listar facturas del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Cliente ve sus propias facturas
    if (user.rol === 'cliente') {
      const facturas = await prisma.factura.findMany({
        where: { usuarioId: user.userId },
        orderBy: { fechaEmision: 'desc' },
        include: {
          expediente: {
            select: {
              referencia: true,
            },
          },
        },
      })

      return NextResponse.json({ facturas })
    }

    // Admin ve todas las facturas
    if (user.rol === 'admin') {
      const { searchParams } = new URL(request.url)
      const usuarioId = searchParams.get('usuarioId')
      const estado = searchParams.get('estado')

      const where: any = {}
      if (usuarioId) where.usuarioId = usuarioId
      if (estado) where.estado = estado

      const facturas = await prisma.factura.findMany({
        where,
        orderBy: { fechaEmision: 'desc' },
        include: {
          usuario: {
            select: {
              nombre: true,
              email: true,
            },
          },
          expediente: {
            select: {
              referencia: true,
            },
          },
        },
      })

      return NextResponse.json({ facturas })
    }

    // Abogado ve facturas de sus expedientes asignados
    if (user.rol === 'abogado') {
      const expedientes = await prisma.expediente.findMany({
        where: { abogadoAsignadoId: user.userId },
        select: { id: true },
      })

      const expedienteIds = expedientes.map(e => e.id)

      const facturas = await prisma.factura.findMany({
        where: {
          OR: [
            { expedienteId: { in: expedienteIds } },
          ],
        },
        orderBy: { fechaEmision: 'desc' },
        include: {
          usuario: {
            select: {
              nombre: true,
              email: true,
            },
          },
          expediente: {
            select: {
              referencia: true,
            },
          },
        },
      })

      return NextResponse.json({ facturas })
    }

    return NextResponse.json({ facturas: [] })
  } catch (error) {
    console.error('Error obteniendo facturas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva factura (solo admin)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      usuarioId,
      expedienteId,
      numero,
      importe,
      concepto,
      contenido, // PDF en base64
      fechaVencimiento,
      notas,
    } = body

    if (!usuarioId || !numero || !importe || !concepto) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el número de factura no existe
    const existingFactura = await prisma.factura.findUnique({
      where: { numero },
    })

    if (existingFactura) {
      return NextResponse.json(
        { error: 'El número de factura ya existe' },
        { status: 400 }
      )
    }

    // Crear la factura
    const factura = await prisma.factura.create({
      data: {
        usuarioId,
        expedienteId: expedienteId || null,
        numero,
        importe,
        concepto,
        contenido: contenido || null,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        notas: notas || null,
        estado: 'emitida',
      },
    })

    // Si hay expedienteId, crear/actualizar el sistema de pagos pendientes
    if (expedienteId) {
      // Buscar o crear el registro de facturación del expediente
      let facturacion = await prisma.facturacion.findUnique({
        where: { expedienteId }
      })

      if (!facturacion) {
        // Crear registro de facturación si no existe
        facturacion = await prisma.facturacion.create({
          data: {
            expedienteId,
            importePresupuestado: importe,
            importeFacturado: 0,
            estado: 'pendiente',
          }
        })
      } else {
        // Actualizar el presupuesto sumando la nueva factura
        await prisma.facturacion.update({
          where: { id: facturacion.id },
          data: {
            importePresupuestado: facturacion.importePresupuestado + importe,
            estado: facturacion.importeFacturado < (facturacion.importePresupuestado + importe) ? 'pendiente' : facturacion.estado,
          }
        })
      }

      // Crear un pago pendiente asociado a esta factura
      await prisma.pago.create({
        data: {
          facturacionId: facturacion.id,
          concepto: `Factura ${numero} - ${concepto}`,
          importe,
          estado: 'pendiente',
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
          notas: `Generado automáticamente desde factura ${numero}`,
        }
      })
    }

    return NextResponse.json({ success: true, factura })
  } catch (error) {
    console.error('Error creando factura:', error)
    return NextResponse.json(
      { error: 'Error al crear la factura' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado de factura (solo admin)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { id, estado, notas, contenido } = body

    if (!id || !estado) {
      return NextResponse.json(
        { error: 'ID y estado son requeridos' },
        { status: 400 }
      )
    }

    const factura = await prisma.factura.update({
      where: { id },
      data: {
        estado,
        notas: notas || undefined,
        contenido: contenido || undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, factura })
  } catch (error) {
    console.error('Error actualizando factura:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la factura' },
      { status: 500 }
    )
  }
}
