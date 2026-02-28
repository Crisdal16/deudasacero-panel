'use client'

import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Euro, 
  Building, 
  TrendingUp,
  Calendar,
  FileText,
  Scale
} from 'lucide-react'
import { Timeline, fasesLSO } from './Timeline'

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
  deudas: Array<{
    id: string
    tipo: string
    importe: number
    descripcion: string | null
    acreedor: string | null
  }>
}

interface DashboardProps {
  expediente: Expediente | null
}

export function Dashboard({ expediente }: DashboardProps) {
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

  const currentFase = fasesLSO[expediente.faseActual - 1] || fasesLSO[0]
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

  return (
    <div className="space-y-6">
      {/* Header del expediente */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Mi Expediente LSO</h1>
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

      {/* Estado actual - Destacado */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm">Fase Actual</p>
              <h2 className="text-2xl font-bold mt-1">
                {currentFase.num}. {currentFase.nombre}
              </h2>
              <p className="text-blue-100 mt-2 text-sm max-w-lg">
                {currentFase.descripcion}
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm">Progreso</p>
              <p className="text-4xl font-bold">{expediente.porcentajeAvance}%</p>
              <p className="text-blue-200 text-sm mt-1">
                Duración estimada: {currentFase.duracion}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Progress 
              value={expediente.porcentajeAvance} 
              className="h-3 bg-blue-950 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-green-300" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline visual completo */}
      <Timeline 
        faseActual={expediente.faseActual} 
        porcentajeAvance={expediente.porcentajeAvance} 
      />

      {/* Resumen económico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-100 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Deuda Total Inicial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(expediente.deudaTotal)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {expediente.deudas?.length || 0} acreedores
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
              {formatCurrency(expediente.deudaPublica)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              AEAT y Seguridad Social
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
              {formatCurrency(expediente.estimacionExoneracion)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Basado en tu caso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalles adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Información del caso */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Scale className="w-5 h-5" />
              Información del Caso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Juzgado</span>
              <span className="font-medium text-gray-900">
                {expediente.juzgado || 'Por determinar'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo procedimiento</span>
              <span className="font-medium text-gray-900">
                {expediente.tipoProcedimiento === 'autonomo' ? 'Autónomo' : 'Persona física'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Situación laboral</span>
              <span className="font-medium text-gray-900">
                {expediente.situacionLaboral || 'No especificada'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Buena fe</span>
              {expediente.buenaFe ? (
                <Badge className="bg-green-100 text-green-800">Acreditada</Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500">Pendiente</Badge>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sin antecedentes</span>
              {expediente.sinAntecedentes ? (
                <Badge className="bg-green-100 text-green-800">Verificado</Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500">Pendiente</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Próximos pasos */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="w-5 h-5" />
              Próximos Pasos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-900 shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">
                    {expediente.faseActual < 10 
                      ? `Continuar con: ${fasesLSO[expediente.faseActual]?.nombre || 'Siguiente fase'}`
                      : '¡Proceso completado!'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Fecha inicio: {formatDate(expediente.fechaPresentacion)}
                  </p>
                </div>
              </div>
              
              {(expediente.abogadoAsignado || expediente.abogadoAsignadoObj) && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Tu abogado asignado</p>
                    <p className="text-sm text-gray-600">
                      {expediente.abogadoAsignadoObj?.nombre || expediente.abogadoAsignado}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-800">
                  💡 <strong>Consejo:</strong> Mantente atento/a a la sección de documentos 
                  para subir cualquier documentación que te solicitemos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
