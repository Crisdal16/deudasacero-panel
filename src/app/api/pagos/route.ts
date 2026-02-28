import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener pagos del cliente
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Cliente ve sus propios pagos
    if (user.rol === 'cliente') {
      // Usar findFirst en lugar de findUnique por si hay múltiples expedientes
      const expedientes = await prisma.expediente.findMany({
        where: { clienteId: user.userId },
        include: {
          facturacion: {
            include: {
              pagos: {
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      })

      // Recopilar todos los pagos de todos los expedientes del cliente
      const pagos = expedientes.flatMap(exp => exp.facturacion?.pagos || [])

      return NextResponse.json({ pagos })
    }

    // Admin ve todos los pagos
    if (user.rol === 'admin') {
      const pagos = await prisma.pago.findMany({
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
    }

    // Abogado ve pagos de sus expedientes
    if (user.rol === 'abogado') {
      const expedientes = await prisma.expediente.findMany({
        where: { abogadoAsignadoId: user.userId },
        include: {
          facturacion: {
            include: {
              pagos: {
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      })

      const pagos = expedientes.flatMap(exp => exp.facturacion?.pagos || [])

      return NextResponse.json({ pagos })
    }

    return NextResponse.json({ pagos: [] })
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
