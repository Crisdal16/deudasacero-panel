import { NextRequest, NextResponse } from 'next/server'
import { withAbogadoOrAdminAuth, withAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener pagos
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const facturacionId = searchParams.get('facturacionId')
      const expedienteId = searchParams.get('expedienteId')
      
      let where: any = {}
      
      if (facturacionId) {
        where.facturacionId = facturacionId
      }

      // Clientes solo ven sus propios pagos
      if (user.rol === 'cliente') {
        where.facturacion = { expediente: { clienteId: user.userId } }
        if (expedienteId) {
          where.facturacion = { ...where.facturacion, expedienteId }
        }
      } else if (user.rol === 'abogado') {
        where.facturacion = { expediente: { abogadoAsignadoId: user.userId } }
        if (expedienteId) {
          where.facturacion = { ...where.facturacion, expedienteId }
        }
      }

      const pagos = await prisma.pago.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ pagos })
    } catch (error) {
      console.error('Error al obtener pagos:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  })
}

// POST - Registrar nuevo pago
export async function POST(request: NextRequest) {
  return withAbogadoOrAdminAuth(request, async (user) => {
    try {
      const body = await request.json()
      const { 
        facturacionId, 
        concepto, 
        importe, 
        metodoPago,
        referencia,
        fechaVencimiento,
        notas 
      } = body

      if (!facturacionId || !concepto || !importe) {
        return NextResponse.json({ 
          error: 'facturacionId, concepto e importe son requeridos' 
        }, { status: 400 })
      }

      // Verificar acceso a la facturación
      const facturacion = await prisma.facturacion.findUnique({
        where: { id: facturacionId },
        include: { expediente: true }
      })

      if (!facturacion) {
        return NextResponse.json({ error: 'Registro de facturación no encontrado' }, { status: 404 })
      }

      if (user.rol === 'abogado' && facturacion.expediente.abogadoAsignadoId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      // Crear el pago
      const pago = await prisma.pago.create({
        data: {
          facturacionId,
          concepto,
          importe: parseFloat(importe),
          metodoPago,
          referencia,
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
          notas,
          estado: 'pendiente',
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

      return NextResponse.json({ 
        message: 'Pago registrado correctamente',
        pago 
      })
    } catch (error) {
      console.error('Error al registrar pago:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  })
}
