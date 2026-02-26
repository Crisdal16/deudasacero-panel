'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Users, 
  MessageSquare, 
  Clock,
  Euro,
  Eye,
  RefreshCw
} from 'lucide-react'

interface Expediente {
  id: string
  referencia: string
  juzgado: string | null
  faseActual: number
  porcentajeAvance: number
  estado: string
  cliente: {
    nombre: string
    email: string
    telefono: string | null
  }
  deudaTotal: number
  documentosPendientes: number
  mensajesNuevos: number
  updatedAt: string
}

const fases = [
  { num: 1, nombre: 'Estudio viabilidad' },
  { num: 2, nombre: 'Presupuesto y encargo' },
  { num: 3, nombre: 'Recopilación docs' },
  { num: 4, nombre: 'Presentación demanda' },
  { num: 5, nombre: 'Admisión concurso' },
  { num: 6, nombre: 'Liquidación' },
  { num: 7, nombre: 'Solicitud EPI' },
  { num: 8, nombre: 'Resolución' },
  { num: 9, nombre: 'Recurso' },
  { num: 10, nombre: 'Finalizado' },
]

interface AbogadoPanelProps {
  onSelectExpediente: (id: string) => void
}

export function AbogadoPanel({ onSelectExpediente }: AbogadoPanelProps) {
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchExpedientes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/abogado/expedientes')
      const data = await res.json()
      setExpedientes(data.expedientes || [])
    } catch (error) {
      console.error('Error fetching expedientes:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los expedientes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpedientes()
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const stats = {
    totalExpedientes: expedientes.length,
    documentosPendientes: expedientes.reduce((sum, e) => sum + e.documentosPendientes, 0),
    mensajesNuevos: expedientes.reduce((sum, e) => sum + e.mensajesNuevos, 0),
    deudaTotal: expedientes.reduce((sum, e) => sum + e.deudaTotal, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Mis Expedientes Asignados</h1>
          <p className="text-gray-600">Gestiona los expedientes que te han sido asignados</p>
        </div>
        <Button onClick={fetchExpedientes} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Expedientes Asignados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{stats.totalExpedientes}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Documentos Pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{stats.documentosPendientes}</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensajes Nuevos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.mensajesNuevos}</p>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Deuda Total Gestionada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.deudaTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de expedientes */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-blue-900">Expedientes en Curso</CardTitle>
          <CardDescription>
            Haz clic en un expediente para ver detalles y gestionarlo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando expedientes...
            </div>
          ) : expedientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tienes expedientes asignados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Deuda Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expedientes.map((exp) => (
                  <TableRow key={exp.id} className="cursor-pointer hover:bg-blue-50">
                    <TableCell className="font-medium">{exp.referencia}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{exp.cliente.nombre}</p>
                        <p className="text-sm text-gray-500">{exp.cliente.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Fase {exp.faseActual}: {fases[exp.faseActual - 1]?.nombre || 'Desconocida'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={exp.porcentajeAvance} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">{exp.porcentajeAvance}%</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(exp.deudaTotal)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {exp.documentosPendientes > 0 && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            {exp.documentosPendientes} docs
                          </Badge>
                        )}
                        {exp.mensajesNuevos > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {exp.mensajesNuevos} msgs
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectExpediente(exp.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
