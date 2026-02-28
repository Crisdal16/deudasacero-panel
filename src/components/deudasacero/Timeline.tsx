'use client'

import { Check, Circle, Clock, FileText, Scale, Gavel, Banknote, FileCheck, MessageSquare, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineProps {
  faseActual: number
  porcentajeAvance: number
  onFaseClick?: (fase: number) => void
  editable?: boolean
}

const fasesLSO = [
  {
    num: 1,
    nombre: 'Estudio Viabilidad',
    descripcion: 'Análisis de tu situación financiera y viabilidad del proceso LSO',
    duracion: '1-2 semanas',
    icono: FileText,
    color: 'bg-blue-500',
  },
  {
    num: 2,
    nombre: 'Presupuesto y Encargo',
    descripcion: 'Presentación de presupuesto profesional y firma de encargo',
    duracion: '1 semana',
    icono: Banknote,
    color: 'bg-green-500',
  },
  {
    num: 3,
    nombre: 'Recopilación Documentos',
    descripcion: 'Recopilación de toda la documentación necesaria para el proceso',
    duracion: '2-4 semanas',
    icono: FileCheck,
    color: 'bg-yellow-500',
  },
  {
    num: 4,
    nombre: 'Presentación Demanda',
    descripcion: 'Presentación de la solicitud de concurso voluntario ante el juzgado',
    duracion: '1-2 semanas',
    icono: Scale,
    color: 'bg-purple-500',
  },
  {
    num: 5,
    nombre: 'Admisión a Concurso',
    descripcion: 'El juzgado admite el concurso y nombra mediador concursal',
    duracion: '4-8 semanas',
    icono: Gavel,
    color: 'bg-indigo-500',
  },
  {
    num: 6,
    nombre: 'Fase de Liquidación',
    descripcion: 'Liquidación del patrimonio disponible para pago a acreedores',
    duracion: '2-4 meses',
    icono: Banknote,
    color: 'bg-orange-500',
  },
  {
    num: 7,
    nombre: 'Solicitud EPI',
    descripcion: 'Solicitud de Exoneración del Pasivo Insatisfecho (EPI)',
    duracion: '1-2 semanas',
    icono: FileText,
    color: 'bg-teal-500',
  },
  {
    num: 8,
    nombre: 'Resolución Judicial',
    descripcion: 'El juez concede o deniega la exoneración de deudas',
    duracion: '2-4 semanas',
    icono: Award,
    color: 'bg-emerald-500',
  },
  {
    num: 9,
    nombre: 'Plan de Pagos',
    descripcion: 'Si aplica, establecimiento del plan de pagos para deudas no exonerables',
    duracion: '3-5 años',
    icono: MessageSquare,
    color: 'bg-amber-500',
  },
  {
    num: 10,
    nombre: 'Proceso Finalizado',
    descripcion: '¡Enhorabuena! Tu proceso LSO ha concluido exitosamente',
    duracion: 'Completado',
    icono: Award,
    color: 'bg-green-600',
  },
]

export function Timeline({ faseActual, porcentajeAvance, onFaseClick, editable = false }: TimelineProps) {
  return (
    <div className="space-y-6">
      {/* Barra de progreso general */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-blue-900">Progreso General</h3>
          <span className="text-2xl font-bold text-blue-900">{porcentajeAvance}%</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${porcentajeAvance}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Fase actual: <span className="font-medium text-blue-900">{fasesLSO[faseActual - 1]?.nombre || 'Desconocida'}</span>
        </p>
      </div>

      {/* Timeline visual */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-blue-900 mb-6">Timeline del Proceso LSO</h3>
        
        <div className="relative">
          {/* Línea conectora vertical */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          {/* Fases */}
          <div className="space-y-4">
            {fasesLSO.map((fase) => {
              const isCompleted = fase.num < faseActual
              const isCurrent = fase.num === faseActual
              const isPending = fase.num > faseActual
              const Icon = fase.icono
              
              return (
                <div
                  key={fase.num}
                  className={cn(
                    "relative flex gap-4 p-4 rounded-lg transition-all",
                    isCurrent && "bg-blue-50 border border-blue-200",
                    isCompleted && "opacity-75",
                    editable && "cursor-pointer hover:bg-gray-50"
                  )}
                  onClick={() => editable && onFaseClick?.(fase.num)}
                >
                  {/* Círculo con icono */}
                  <div
                    className={cn(
                      "relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                      isCompleted && "bg-green-500 text-white",
                      isCurrent && "bg-blue-500 text-white ring-4 ring-blue-100",
                      isPending && "bg-gray-200 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Contenido */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={cn(
                          "font-medium",
                          isCurrent && "text-blue-900",
                          isCompleted && "text-gray-700",
                          isPending && "text-gray-400"
                        )}
                      >
                        Fase {fase.num}: {fase.nombre}
                      </h4>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          isCompleted && "bg-green-100 text-green-700",
                          isCurrent && "bg-blue-100 text-blue-700",
                          isPending && "bg-gray-100 text-gray-500"
                        )}
                      >
                        {fase.duracion}
                      </span>
                    </div>
                    
                    <p
                      className={cn(
                        "text-sm mt-1",
                        isCurrent && "text-gray-600",
                        (isCompleted || isPending) && "text-gray-400"
                      )}
                    >
                      {fase.descripcion}
                    </p>
                    
                    {isCurrent && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <Clock className="w-4 h-4" />
                        <span>Esta es tu fase actual</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-100">
        <h4 className="font-medium text-blue-900 mb-2">¿Tienes dudas sobre el proceso?</h4>
        <p className="text-sm text-gray-600">
          Cada caso es único y los tiempos pueden variar. Tu abogado asignado te mantendrá
          informado/a de cualquier novedad. Si tienes preguntas, puedes usar el sistema de
          mensajería para contactar directamente con nosotros.
        </p>
      </div>
    </div>
  )
}

// Componente simplificado para el admin
export function TimelineSelector({ faseActual, onFaseChange }: { faseActual: number; onFaseChange: (fase: number) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {fasesLSO.map((fase) => (
        <button
          key={fase.num}
          onClick={() => onFaseChange(fase.num)}
          className={cn(
            "p-3 rounded-lg border text-center transition-all",
            fase.num === faseActual
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white hover:bg-gray-50 border-gray-200"
          )}
        >
          <div className="text-lg font-bold">{fase.num}</div>
          <div className="text-xs truncate">{fase.nombre.split(' ')[0]}</div>
        </button>
      ))}
    </div>
  )
}

export { fasesLSO }
