'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  User, 
  Building, 
  Calendar, 
  Scale, 
  CheckCircle2, 
  XCircle,
  Briefcase,
  Euro,
  TrendingUp,
  CreditCard
} from 'lucide-react'

interface Deuda {
  id: string
  tipo: string
  importe: number
  descripcion: string | null
  acreedor: string | null
}

interface Expediente {
  id: string
  referencia: string
  juzgado: string | null
  tipoProcedimiento: string
  faseActual: number
  porcentajeAvance: number
  fechaPresentacion: string | null
  abogadoAsignado: string | null
  abogadoAsignadoObj?: {
    nombre: string
  } | null
  situacionLaboral: string | null
  buenaFe: boolean
  sinAntecedentes: boolean
  deudaTotal: number
  deudaPublica: number
  deudaFinanciera: number
  estimacionExoneracion: number
  deudas?: Deuda[]
  usuario?: {
    nombre: string
    email: string
    nif: string | null
    telefono: string | null
  }
}

interface ExpedienteDetalleProps {
  expediente: Expediente | null
}

export function ExpedienteDetalle({ expediente }: ExpedienteDetalleProps) {
  if (!expediente) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600">Sin expediente activo</h2>
        <p className="text-gray-500 mt-2">
          Tu expediente está siendo procesado. Pronto podrás ver toda la información aquí.
        </p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Pendiente'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  // Obtener nombre del abogado (compatibilidad con ambos formatos)
  const nombreAbogado = expediente.abogadoAsignadoObj?.nombre || expediente.abogadoAsignado || 'Por asignar'

  // Agrupar deudas por tipo
  const deudasPorTipo = (expediente.deudas || []).reduce((acc, deuda) => {
    const tipo = deuda.tipo || 'otros'
    if (!acc[tipo]) acc[tipo] = []
    acc[tipo].push(deuda)
    return acc
  }, {} as Record<string, Deuda[]>)

  const tipoLabels: Record<string, string> = {
    financiera: 'Deuda Financiera',
    publica: 'Deuda Pública',
    proveedores: 'Proveedores',
    hipoteca: 'Hipoteca',
    otros: 'Otros'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Mi Expediente Detallado</h1>
          <p className="text-gray-600">Referencia: {expediente.referencia}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg py-1 px-4 bg-blue-50 border-blue-200 text-blue-800">
            Fase {expediente.faseActual} de 10
          </Badge>
          {expediente.tipoProcedimiento === 'autonomo' && (
            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-800">
              Autónomo
            </Badge>
          )}
        </div>
      </div>

      {/* Resumen de deuda */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-100 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Deuda Total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(expediente.deudaTotal || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(expediente.deudas || []).length} acreedores
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Deuda Pública
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(expediente.deudaPublica || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              AEAT y Seguridad Social
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Deuda Financiera
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(expediente.deudaFinanciera || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Bancos y tarjetas
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Estimación Exoneración
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(expediente.estimacionExoneracion || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Basado en tu caso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Datos del procedimiento */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="w-5 h-5" />
            Datos del Procedimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Referencia</p>
                  <p className="font-medium">{expediente.referencia}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Juzgado</p>
                  <p className="font-medium">{expediente.juzgado || 'Por determinar'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Scale className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Tipo de Procedimiento</p>
                  <p className="font-medium">
                    {expediente.tipoProcedimiento === 'persona_fisica' 
                      ? 'Persona Física' 
                      : 'Autónomo'}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Fecha de Presentación</p>
                  <p className="font-medium">{formatDate(expediente.fechaPresentacion)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Abogado Asignado</p>
                  <p className="font-medium">{nombreAbogado}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Situación Laboral</p>
                  <p className="font-medium">{expediente.situacionLaboral || 'No especificada'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progreso */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Progreso del expediente</span>
              <span className="text-sm font-medium text-blue-900">{expediente.porcentajeAvance}%</span>
            </div>
            <Progress 
              value={expediente.porcentajeAvance} 
              className="h-2 bg-gray-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-green-500" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Datos del cliente */}
      {expediente.usuario && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <User className="w-5 h-5" />
              Datos Personales
            </CardTitle>
            <CardDescription>Información del titular del expediente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Nombre completo</p>
                    <p className="font-medium">{expediente.usuario.nombre}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">NIF/DNI</p>
                    <p className="font-medium">{expediente.usuario.nif || 'No especificado'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{expediente.usuario.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{expediente.usuario.telefono || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listado de deudas */}
      {(expediente.deudas && expediente.deudas.length > 0) && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Euro className="w-5 h-5" />
              Detalle de Deudas
            </CardTitle>
            <CardDescription>Relación de acreedores incluidos en el procedimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(deudasPorTipo).map(([tipo, deudas]) => (
                <div key={tipo} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">
                      {tipoLabels[tipo] || tipo}
                    </h4>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(deudas.reduce((sum, d) => sum + d.importe, 0))}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg divide-y">
                    {deudas.map((deuda) => (
                      <div key={deuda.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {deuda.acreedor || 'Acreedor no especificado'}
                          </p>
                          {deuda.descripcion && (
                            <p className="text-sm text-gray-500">{deuda.descripcion}</p>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(deuda.importe)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requisitos LSO */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Scale className="w-5 h-5" />
            Requisitos para la LSO
          </CardTitle>
          <CardDescription>Condiciones necesarias para acogerse a la Ley de Segunda Oportunidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`flex items-center gap-3 p-4 rounded-lg ${expediente.buenaFe ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              {expediente.buenaFe ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <p className="font-medium">De buena fe</p>
                <p className="text-sm text-gray-500">No ha actuado de forma fraudulenta</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-4 rounded-lg ${expediente.sinAntecedentes ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              {expediente.sinAntecedentes ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Sin antecedentes penales</p>
                <p className="text-sm text-gray-500">Delitos económicos, Hacienda, SS</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
