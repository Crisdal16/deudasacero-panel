import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateLegalDocument } from '@/lib/perplexity'

// Plantillas de documentos para la Ley de Segunda Oportunidad
const plantillasDocumentos: Record<string, { nombre: string; prompt: string }> = {
  solicitud_beneficio: {
    nombre: 'Solicitud de Beneficio de Exoneración',
    prompt: `Genera un documento formal de SOLICITUD DE BENEFICIO DE EXONERACIÓN DEL PASIVO INSATISFECHO 
al amparo de la Ley 1/2015, de mecanismo de segunda oportunidad.

DATOS DEL SOLICITANTE:
- Nombre completo: {nombre}
- DNI/NIE: {dni}
- Dirección: {direccion}
- Localidad: {localidad}
- Código Postal: {cp}
- Teléfono: {telefono}
- Email: {email}

DATOS ECONÓMICOS:
- Deuda total: {deuda_total}€
- Número de acreedores: {num_acreedores}
- Ingresos mensuales: {ingresos}€
- Patrimonio: {patrimonio}€

 acreedores:
{acreedores}

El documento debe incluir:
1. Encabezado con datos del Juzgado de lo Mercantil competente
2. Identificación completa del solicitante
3. Antecedentes y exposición de hechos que motivan la situación de insolvencia
4. Relación de acreedores y deudas
5. Relación de bienes y derechos
6. Manifestación de haber actuado de buena fe (art. 487 TRLC)
7. Solicitud de concesión del beneficio de exoneración
8. Documentación que se adjunta
9. Lugar, fecha y firma
10. Otrosí de solicitud de nombramiento de mediador concursal si procede

Formato: Documento legal formal en español con estructura profesional de abogado.`
  },
  
  inventario_bienes: {
    nombre: 'Inventario de Bienes y Derechos',
    prompt: `Genera un INVENTARIO DE BIENES Y DERECHOS formal para procedimiento de Ley de Segunda Oportunidad.

DATOS DEL DEUDOR:
- Nombre completo: {nombre}
- DNI/NIE: {dni}
- Dirección: {direccion}

El documento debe incluir las siguientes secciones claramente diferenciadas:

1. BIENES INMUEBLES
   - Descripción completa (tipo, dirección, metros cuadrados, registro)
   - Valor catastral y valor de mercado estimado
   - Cargas y gravámenes existentes

2. BIENES MUEBLES DE VALOR
   - Vehículos (marca, modelo, matrícula, valor)
   - Joyas y objetos de valor
   - Equipos electrónicos
   - Otros muebles de valor significativo

3. CUENTAS BANCARIAS Y ACTIVOS FINANCIEROS
   - Entidad bancaria, tipo de cuenta, saldo actual
   - Inversiones, fondos, acciones

4. DERECHOS DE CRÉDITO
   - Créditos a favor del deudor
   - Depósitos y fianzas

5. OTROS ACTIVOS
   - Cualquier otro bien o derecho susceptible de valoración

6. RESUMEN Y VALORACIÓN TOTAL

Formato: Tabla estructurada profesionalmente con columnas: Descripción, Valor Estimado, Observaciones/Cargas.`
  },
  
  propuesta_pago: {
    nombre: 'Propuesta de Plan de Pagos',
    prompt: `Genera una PROPUESTA DE PLAN DE PAGOS para acuerdo extrajudicial de pagos en el marco de la Ley de Segunda Oportunidad.

DATOS:
- Deudor: {nombre}
- DNI/NIE: {dni}
- Deuda total: {deuda_total}€
- Capacidad de pago mensual: {pago_mensual}€
- Plazo propuesto: {plazo} meses
- Ingresos netos mensuales: {ingresos}€
- Gastos mensuales básicos: {gastos}€

LISTA DE ACREEDORES:
{acreedores}

El documento debe incluir:
1. Identificación del deudor y situación patrimonial actual
2. Descripción de la situación de insolvencia
3. Propuesta de plan de pagos estructurada:
   - Cuantía ofrecida a cada acreedor
   - Plazos y forma de pago
   - Quitas solicitadas si las hubiera
4. Cronograma de pagos detallado
5. Compromisos del deudor durante el plan
6. Manifestación de buena fe
7. Solicitud de aprobación

Formato: Documento formal con estructura clara y profesional.`
  },
  
  declaracion_buena_fe: {
    nombre: 'Declaración de Buena Fe',
    prompt: `Genera una DECLARACIÓN JURADA DE BUENA FE para procedimiento de Ley de Segunda Oportunidad.

DATOS DEL SOLICITANTE:
- Nombre completo: {nombre}
- DNI/NIE: {dni}
- Dirección: {direccion}

La declaración debe incluir manifestaciones formales sobre:
1. No haber sido condenado en sentencia firme por delitos contra el patrimonio, contra el orden socioeconómico, de falsedad documental, contra la Hacienda Pública o la Seguridad Social en los últimos 10 años
2. No haber obtenido el beneficio de exoneración en los últimos 5 años
3. Haber celebrado acuerdos de refinanciación o obtenido nombramiento de mediador concursal
4. No haber ocultado bienes ni documentación relevante
5. Colaboración con el mediador concursal
6. Aceptación de las consecuencias del beneficio de exoneración

Formato: Documento legal formal con estructura de declaración jurada.`
  },
  
  carta_acreedor: {
    nombre: 'Carta a Acreedor',
    prompt: `Genera una CARTA FORMAL DIRIGIDA A UN ACREEDOR informando de la situación de insolvencia y el inicio del procedimiento de segunda oportunidad.

DATOS:
- Remitente: {nombre}
- DNI/NIE: {dni}
- Dirección: {direccion}
- Acreedor: {nombre_acreedor}
- Dirección del acreedor: {direccion_acreedor}
- Cantidad adeudada: {cantidad}€
- Referencia/Número de cuenta: {referencia}

La carta debe incluir:
1. Encabezado formal
2. Identificación del deudor
3. Información sobre la situación de insolvencia
4. Comunicación del inicio del procedimiento de segunda oportunidad
5. Solicitud de suspensión de intereses y acciones de cobro
6. Datos del mediador concursal (si lo hay)
7. Información de contacto para consultas
8. Despedida formal

Tono: Formal, respetuoso y profesional.`
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { tipo, expedienteId, datos } = body

    if (!tipo || !plantillasDocumentos[tipo]) {
      return NextResponse.json({ 
        error: 'Tipo de documento no válido. Tipos disponibles: ' + Object.keys(plantillasDocumentos).join(', ')
      }, { status: 400 })
    }

    const plantilla = plantillasDocumentos[tipo]
    
    // Construir prompt con los datos proporcionados
    let promptFinal = plantilla.prompt
    
    if (datos) {
      Object.entries(datos).forEach(([key, value]) => {
        const placeholder = `{${key}}`
        const valor = value !== undefined && value !== null && value !== '' ? String(value) : 'No especificado'
        promptFinal = promptFinal.replace(new RegExp(placeholder, 'g'), valor)
      })
    }

    // Obtener datos del expediente si se proporciona ID
    let datosExpediente = ''
    if (expedienteId) {
      const expediente = await prisma.expediente.findUnique({
        where: { id: expedienteId },
        include: {
          cliente: true,
          documentos: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })
      
      if (expediente && expediente.cliente) {
        datosExpediente = `
Contexto adicional del expediente:
- Número de expediente: ${expediente.numero}
- Fase actual: ${expediente.fase}
- Cliente: ${expediente.cliente.nombre}
- Deuda total registrada: ${expediente.deudaTotal}€
`
      }
    }

    // Generar documento con Perplexity
    const contenido = await generateLegalDocument(
      promptFinal,
      `Eres un abogado experto en la Ley de Segunda Oportunidad española (Ley 1/2015, TRLC).
Generas documentos legales formales, precisos y profesionalmente estructurados.
Usas terminología jurídica correcta y haces referencia a la normativa aplicable cuando corresponde.
${datosExpediente}`
    )

    // Guardar documento en la base de datos
    const documento = await prisma.documento.create({
      data: {
        nombre: plantilla.nombre,
        tipo: tipo.toUpperCase(),
        contenido: contenido,
        expedienteId: expedienteId || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      documento: {
        id: documento.id,
        nombre: documento.nombre,
        tipo: documento.tipo,
        contenido: documento.contenido,
        createdAt: documento.createdAt
      }
    })

  } catch (error: any) {
    console.error('Error generando documento:', error)
    return NextResponse.json(
      { error: 'Error al generar documento', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Listar tipos de documentos disponibles
export async function GET() {
  return NextResponse.json({
    tipos: Object.entries(plantillasDocumentos).map(([key, value]) => ({
      id: key,
      nombre: value.nombre
    }))
  })
}
