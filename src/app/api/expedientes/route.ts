import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Listar todos los expedientes (solo admin)
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const fase = searchParams.get('fase')
      const estado = searchParams.get('estado')
      const abogadoId = searchParams.get('abogadoId')

      const where: any = {}
      if (fase) where.faseActual = parseInt(fase)
      if (estado) where.estado = estado
      if (abogadoId) where.abogadoAsignadoId = abogadoId

      const expedientes = await prisma.expediente.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true,
              nif: true,
            },
          },
          abogadoAsignado: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          deudas: true,
          documentos: {
            where: { esJudicial: false },
          },
          mensajes: {
            where: { leido: false, remitente: 'cliente' },
          },
          facturacion: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      const expedientesConInfo = expedientes.map((exp) => ({
        ...exp,
        deudaTotal: exp.deudas.reduce((sum, d) => sum + d.importe, 0),
        documentosPendientes: exp.documentos.filter((d) => d.estado === 'pendiente').length,
        mensajesNuevos: exp.mensajes.length,
      }))

      return NextResponse.json({ expedientes: expedientesConInfo })
    } catch (error) {
      console.error('Error obteniendo expedientes:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}

// POST - Crear nuevo expediente (solo admin)
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (user) => {
    try {
      const body = await request.json()
      const {
        clienteId,
        referencia,
        juzgado,
        tipoProcedimiento,
        situacionLaboral,
        buenaFe,
        sinAntecedentes,
        estadoCivil,
        hijos,
      } = body

      if (!clienteId || !referencia) {
        return NextResponse.json(
          { error: 'Cliente y referencia son requeridos' },
          { status: 400 }
        )
      }

      // Verificar que el cliente existe
      const cliente = await prisma.usuario.findUnique({
        where: { id: clienteId, rol: 'cliente' },
      })

      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 400 }
        )
      }

      // Verificar que la referencia es única
      const existingExp = await prisma.expediente.findUnique({
        where: { referencia },
      })

      if (existingExp) {
        return NextResponse.json(
          { error: 'La referencia ya existe' },
          { status: 400 }
        )
      }

      const expediente = await prisma.expediente.create({
        data: {
          clienteId,
          referencia,
          juzgado,
          tipoProcedimiento: tipoProcedimiento || 'persona_fisica',
          situacionLaboral,
          buenaFe: buenaFe || false,
          sinAntecedentes: sinAntecedentes || false,
          estadoCivil,
          hijos: hijos || 0,
        },
        include: {
          cliente: {
            select: { nombre: true, email: true },
          },
        },
      })

      // Crear checklist estándar
      const checklistEstandar = [
        { nombre: 'DNI/NIE', orden: 1 },
        { nombre: 'IRPF últimos 2 años', orden: 2 },
        { nombre: 'Vida laboral completa', orden: 3 },
        { nombre: 'Certificado paro (si aplica)', orden: 4 },
        { nombre: 'Certificado empadronamiento', orden: 5 },
        { nombre: 'Extractos bancarios 6 meses', orden: 6 },
        { nombre: 'Certificado AEAT deudas', orden: 7 },
        { nombre: 'Certificado Seguridad Social', orden: 8 },
        { nombre: 'Escrituras propiedades (si aplica)', orden: 9 },
        { nombre: 'Contrato trabajo actual', orden: 10 },
        { nombre: 'Últimas 3 nóminas', orden: 11 },
        { nombre: 'Título académico (si aplica)', orden: 12 },
        { nombre: 'Certificado antecedentes penales', orden: 13 },
      ]

      await prisma.checklistDocumento.createMany({
        data: checklistEstandar.map((item) => ({
          expedienteId: expediente.id,
          nombre: item.nombre,
          orden: item.orden,
          obligatorio: true,
        })),
      })

      // Registrar en audit log
      await prisma.auditLog.create({
        data: {
          usuarioId: user.userId,
          expedienteId: expediente.id,
          accion: 'crear_expediente',
          descripcion: `Creado expediente ${referencia} para cliente ${cliente.nombre}`,
        },
      })

      return NextResponse.json({ expediente })
    } catch (error) {
      console.error('Error creando expediente:', error)
      return NextResponse.json(
        { error: 'Error al crear expediente' },
        { status: 500 }
      )
    }
  })
}
