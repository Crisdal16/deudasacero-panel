'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  User, 
  Building, 
  Calendar, 
  Scale, 
  CheckCircle2, 
  XCircle,
  Briefcase
} from 'lucide-react'

interface Expediente {
  id: string
  referencia: string
  juzgado: string | null
  tipoProcedimiento: string
  faseActual: number
  porcentajeAvance: number
  fechaPresentacion: string | null
  abogadoAsignado: string | null
  situacionLaboral: string | null
  buenaFe: boolean
  sinAntecedentes: boolean
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
      </div>
    )
  }

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
      <h1 className="text-2xl font-bold text-blue-900">Mi Expediente</h1>

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
                  <p className="font-medium">{expediente.abogadoAsignado || 'Por asignar'}</p>
                </div>
              </div>
            </div>
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
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Situación Laboral</p>
                    <p className="font-medium">{expediente.situacionLaboral || 'No especificada'}</p>
                  </div>
                </div>
              </div>
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
