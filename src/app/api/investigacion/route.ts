import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { legalResearch } from '@/lib/perplexity'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { expedienteId, consulta } = body

    if (!consulta) {
      return NextResponse.json({ error: 'La consulta es requerida' }, { status: 400 })
    }

    // Obtener contexto del expediente si se proporciona
    let contextoExpediente = ''
    if (expedienteId) {
      const expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
        include: {
          cliente: {
            select: {
              nombre: true,
              email: true,
              telefono: true
            }
          },
          documentos: {
            select: {
              nombre: true,
              tipo: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          timeline: {
            select: {
              descripcion: true,
              fecha: true,
              fase: true
            },
            orderBy: { fecha: 'desc' },
            take: 10
          }
        }
      })
      
      if (expediente) {
        contextoExpediente = `
Contexto del expediente actual:
- Número de expediente: ${expediente.numero}
- Fase actual: ${expediente.fase}
- Estado: ${expediente.estado}
- Deuda total: ${expediente.deudaTotal}€
- Cliente: ${expediente.cliente?.nombre || 'No asignado'}
- Últimos eventos: ${expediente.timeline.map(t => `${t.fase}: ${t.descripcion}`).join('; ')}
`
      }
    }

    // Realizar investigación con Perplexity (tiene acceso a internet)
    const resultado = await legalResearch(consulta, contextoExpediente)

    // Guardar la investigación como documento
    const investigacion = await prisma.documento.create({
      data: {
        nombre: `Investigación: ${consulta.substring(0, 50)}${consulta.length > 50 ? '...' : ''}`,
        tipo: 'INVESTIGACION',
        contenido: resultado.respuesta,
        expedienteId: expedienteId || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      respuesta: resultado.respuesta,
      citas: resultado.citas,
      investigacionId: investigacion.id
    })

  } catch (error: any) {
    console.error('Error en investigación:', error)
    return NextResponse.json(
      { error: 'Error en la investigación', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Obtener investigaciones previas
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const expedienteId = searchParams.get('expedienteId')

    const whereClause = expedienteId 
      ? { tipo: 'INVESTIGACION', expedienteId }
      : { tipo: 'INVESTIGACION' }

    const investigaciones = await prisma.documento.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      investigaciones: investigaciones.map(inv => ({
        id: inv.id,
        nombre: inv.nombre,
        contenido: inv.contenido,
        createdAt: inv.createdAt
      }))
    })

  } catch (error: any) {
    console.error('Error obteniendo investigaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener investigaciones' },
      { status: 500 }
    )
  }
}
