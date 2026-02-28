import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Obtener firmas de un expediente
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const expedienteId = searchParams.get('expedienteId')
      
      if (!expedienteId) {
        return NextResponse.json({ error: 'expedienteId es requerido' }, { status: 400 })
      }

      // Verificar acceso al expediente
      const expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
        select: { clienteId: true, abogadoAsignadoId: true }
      })

      if (!expediente) {
        return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
      }

      // Verificar permisos
      if (user.rol === 'cliente' && expediente.clienteId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      
      if (user.rol === 'abogado' && expediente.abogadoAsignadoId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const firmas = await prisma.firma.findMany({
        where: { expedienteId },
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true }
          }
        },
        orderBy: { fechaFirma: 'desc' }
      })

      return NextResponse.json({ firmas })
    } catch (error) {
      console.error('Error al obtener firmas:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  })
}

// POST - Crear nueva firma manuscrita
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const { expedienteId, documento, firmaData, tipo = 'manuscrita' } = body

      if (!expedienteId || !documento || !firmaData) {
        return NextResponse.json({ 
          error: 'expedienteId, documento y firmaData son requeridos' 
        }, { status: 400 })
      }

      // Verificar acceso al expediente
      const expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
        select: { clienteId: true, abogadoAsignadoId: true }
      })

      if (!expediente) {
        return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
      }

      // Verificar permisos (solo cliente del expediente puede firmar)
      if (user.rol === 'cliente' && expediente.clienteId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      // Obtener IP y User Agent
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      // Crear la firma
      const firma = await prisma.firma.create({
        data: {
          expedienteId,
          usuarioId: user.userId,
          tipo,
          documento,
          datosFirma: JSON.stringify({
            firmaData,
            userAgent,
            timestamp: new Date().toISOString()
          }),
          ip,
          verificado: true, // Firma manuscrita se considera verificada
        },
        include: {
          usuario: {
            select: { id: true, nombre: true, email: true }
          }
        }
      })

      // Registrar en audit log
      await prisma.auditLog.create({
        data: {
          usuarioId: user.userId,
          expedienteId,
          accion: 'firma_documento',
          descripcion: `Documento "${documento}" firmado electrónicamente`,
          ip,
          userAgent
        }
      })

      return NextResponse.json({ 
        message: 'Firma registrada correctamente',
        firma 
      })
    } catch (error) {
      console.error('Error al crear firma:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  })
}
