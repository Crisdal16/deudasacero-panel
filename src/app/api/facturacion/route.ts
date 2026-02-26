import { NextRequest, NextResponse } from 'next/server'
import { withAbogadoOrAdminAuth, withAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener facturación
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const expedienteId = searchParams.get('expedienteId')
    
    let where: any = {}
    
    // Clientes solo ven su propia facturación
    if (user.rol === 'cliente') {
      where.expediente = { clienteId: user.userId }
      if (expedienteId) {
        where.expedienteId = expedienteId
      }
    } else if (user.rol === 'abogado') {
      // Abogados ven facturación de sus expedientes asignados
      where.expediente = { abogadoAsignadoId: user.userId }
      if (expedienteId) {
        where.expedienteId = expedienteId
      }
    } else {
      // Admin ve todo
      if (expedienteId) {
        where.expedienteId = expedienteId
      }
    }

    // Para clientes, devolver solo un registro de facturación
    if (user.rol === 'cliente') {
      const facturacion = await prisma.facturacion.findFirst({
        where,
        include: {
          expediente: {
            select: { 
              id: true, 
              referencia: true,
              cliente: { select: { id: true, nombre: true, email: true } }
            }
          },
          pagos: {
            orderBy: { createdAt: 'desc' }
          }
        },
      })

      return NextResponse.json({ 
        facturacion,
        pagos: facturacion?.pagos || []
      })
    }

    // Para admin y abogados, devolver lista
    const facturacion = await prisma.facturacion.findMany({
      where,
      include: {
        expediente: {
          select: { 
            id: true, 
            referencia: true,
            cliente: { select: { id: true, nombre: true, email: true } }
          }
        },
        pagos: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ facturacion })
  } catch (error) {
    console.error('Error al obtener facturación:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear registro de facturación
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || (user.rol !== 'admin' && user.rol !== 'abogado')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      expedienteId, 
      importePresupuestado, 
      metodoPago,
      estado = 'pendiente'
    } = body

    if (!expedienteId || !importePresupuestado) {
      return NextResponse.json({ 
        error: 'expedienteId e importePresupuestado son requeridos' 
      }, { status: 400 })
    }

    // Verificar acceso al expediente
    const expediente = await prisma.expediente.findUnique({
      where: { id: expedienteId }
    })

    if (!expediente) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
    }

    if (user.rol === 'abogado' && expediente.abogadoAsignadoId !== user.userId) {
      return NextResponse.json({ error: 'No autorizado para este expediente' }, { status: 403 })
    }

    // Verificar si ya existe facturación para este expediente
    const existente = await prisma.facturacion.findUnique({
      where: { expedienteId }
    })

    if (existente) {
      return NextResponse.json({ 
        error: 'Ya existe un registro de facturación para este expediente',
        facturacion: existente 
      }, { status: 400 })
    }

    const facturacion = await prisma.facturacion.create({
      data: {
        expedienteId,
        importePresupuestado: parseFloat(importePresupuestado),
        metodoPago,
        estado,
      },
      include: {
        expediente: {
          select: { 
            id: true, 
            referencia: true,
            cliente: { select: { id: true, nombre: true, email: true } }
          }
        }
      }
    })

    // Registrar en audit log
    await prisma.auditLog.create({
      data: {
        usuarioId: user.userId,
        expedienteId,
        accion: 'crear_facturacion',
        descripcion: `Facturación creada con presupuesto de ${importePresupuestado}€`,
      }
    })

    return NextResponse.json({ 
      message: 'Facturación creada correctamente',
      facturacion 
    })
  } catch (error) {
    console.error('Error al crear facturación:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PATCH - Actualizar facturación
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || (user.rol !== 'admin' && user.rol !== 'abogado')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { id, importePresupuestado, importeFacturado, metodoPago, estado } = body

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const facturacion = await prisma.facturacion.findUnique({
      where: { id },
      include: { expediente: true }
    })

    if (!facturacion) {
      return NextResponse.json({ error: 'Facturación no encontrada' }, { status: 404 })
    }

    if (user.rol === 'abogado' && facturacion.expediente.abogadoAsignadoId !== user.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const actualizada = await prisma.facturacion.update({
      where: { id },
      data: {
        ...(importePresupuestado !== undefined && { importePresupuestado: parseFloat(importePresupuestado) }),
        ...(importeFacturado !== undefined && { importeFacturado: parseFloat(importeFacturado) }),
        ...(metodoPago && { metodoPago }),
        ...(estado && { estado }),
      },
      include: {
        expediente: {
          select: { 
            id: true, 
            referencia: true,
            cliente: { select: { id: true, nombre: true, email: true } }
          }
        },
        pagos: true
      }
    })

    return NextResponse.json({ 
      message: 'Facturación actualizada correctamente',
      facturacion: actualizada 
    })
  } catch (error) {
    console.error('Error al actualizar facturación:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Helper function
async function getCurrentUser() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  
  const { verifyToken } = await import('@/lib/auth')
  return verifyToken(token)
}
