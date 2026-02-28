import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Descargar el PDF de una factura
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
      if (factura.usuarioId !== user.userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    } else if (user.rol === 'abogado') {
      if (factura.expediente) {
        const expediente = await prisma.expediente.findUnique({
          where: { id: factura.expediente.id }
        })
        if (expediente?.abogadoAsignadoId !== user.userId) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }
      }
    }

    // Verificar que la factura tiene contenido
    if (!factura.contenido) {
      return NextResponse.json({ 
        error: 'La factura no tiene documento adjunto' 
      }, { status: 404 })
    }

    // Devolver el contenido base64
    // El contenido ya está en base64, si tiene el prefijo data: lo quitamos
    let contenidoBase64 = factura.contenido
    if (contenidoBase64.startsWith('data:')) {
      contenidoBase64 = contenidoBase64.split(',')[1]
    }

    return NextResponse.json({
      contenido: contenidoBase64,
      numero: factura.numero,
      nombreArchivo: `factura-${factura.numero}.pdf`
    })
  } catch (error) {
    console.error('Error descargando factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
