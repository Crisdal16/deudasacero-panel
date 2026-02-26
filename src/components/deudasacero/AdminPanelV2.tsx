'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Clock,
  CheckCircle2,
  Edit,
  Euro,
  UserPlus,
  RefreshCw,
  Scale,
  ArrowRight,
  ChevronRight
} from 'lucide-react'
import { TimelineSelector, fasesLSO } from './Timeline'
import { cn } from '@/lib/utils'

interface Expediente {
  id: string
  referencia: string
  faseActual: number
  porcentajeAvance: number
  estado: string
  cliente: {
    id: string
    nombre: string
    email: string
    telefono: string | null
    nif: string | null
  }
  abogadoAsignado: {
    id: string
    nombre: string
    email: string
  } | null
  deudaTotal: number
  documentosPendientes: number
  mensajesNuevos: number
  notasInternas?: string | null
}

interface Abogado {
  id: string
  nombre: string
  email: string
  telefono: string | null
  activo: boolean
  _count: {
    expedientesComoAbogado: number
  }
}

export function AdminPanelV2() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [abogados, setAbogados] = useState<Abogado[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null)
  const [showAsignarDialog, setShowAsignarDialog] = useState(false)
  const [showAbogadoDialog, setShowAbogadoDialog] = useState(false)
  const [showFaseDialog, setShowFaseDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'expedientes' | 'abogados'>('expedientes')
  const { toast } = useToast()

  // Formulario nuevo abogado
  const [nuevoAbogado, setNuevoAbogado] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
  })

  // Notas internas
  const [notasInternas, setNotasInternas] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expRes, abogRes] = await Promise.all([
        fetch('/api/expedientes'),
        fetch('/api/admin/abogados'),
      ])
      const expData = await expRes.json()
      const abogData = await abogRes.json()
      setExpedientes(expData.expedientes || [])
      setAbogados(abogData.abogados || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

  const stats = {
    totalExpedientes: expedientes.length,
    pendientesDocumentos: expedientes.filter(e => e.documentosPendientes > 0).length,
    mensajesNuevos: expedientes.reduce((sum, e) => sum + e.mensajesNuevos, 0),
    deudaTotal: expedientes.reduce((sum, e) => sum + e.deudaTotal, 0),
    sinAsignar: expedientes.filter(e => !e.abogadoAsignado).length,
  }

  const handleAsignarAbogado = async (expedienteId: string, abogadoId: string | null) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/asignar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abogadoId }),
      })
      if (!res.ok) throw new Error('Error al asignar')
      
      toast({
        title: 'Abogado asignado',
        description: 'El abogado ha sido asignado correctamente',
      })
      fetchData()
      setShowAsignarDialog(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo asignar el abogado',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCambiarFase = async (nuevaFase: number) => {
    if (!selectedExpediente) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/expedientes/${selectedExpediente.id}/fase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fase: nuevaFase }),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Error al cambiar fase')
      
      toast({
        title: 'Fase actualizada',
        description: data.message,
      })
      fetchData()
      setShowFaseDialog(false)
      setSelectedExpediente(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cambiar la fase',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCrearAbogado = async () => {
    if (!nuevoAbogado.nombre || !nuevoAbogado.email || !nuevoAbogado.password) {
      toast({
        title: 'Error',
        description: 'Nombre, email y contraseña son obligatorios',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/abogados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoAbogado),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear abogado')
      }
      
      toast({
        title: 'Abogado creado',
        description: 'El abogado ha sido creado correctamente',
      })
      setNuevoAbogado({ nombre: '', email: '', password: '', telefono: '' })
      setShowAbogadoDialog(false)
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el abogado',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const openFaseDialog = (exp: Expediente) => {
    setSelectedExpediente(exp)
    setNotasInternas(exp.notasInternas || '')
    setShowFaseDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona expedientes, abogados y clientes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Expedientes
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
              Sin Asignar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{stats.sinAsignar}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Docs Pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendientesDocumentos}</p>
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
              Deuda Total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.deudaTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'expedientes' ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-500'}`}
          onClick={() => setActiveTab('expedientes')}
        >
          Expedientes
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'abogados' ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-500'}`}
          onClick={() => setActiveTab('abogados')}
        >
          Abogados
        </button>
      </div>

      {/* Contenido: Expedientes */}
      {activeTab === 'expedientes' && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-900">Expedientes Activos</CardTitle>
            <CardDescription>
              Gestiona todos los expedientes y actualiza el progreso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Deuda</TableHead>
                    <TableHead>Abogado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expedientes.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium">{exp.referencia}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{exp.cliente.nombre}</p>
                          <p className="text-sm text-gray-500">{exp.cliente.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {exp.faseActual}/10 - {fasesLSO[exp.faseActual - 1]?.nombre?.split(' ')[0]}
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
                        {exp.abogadoAsignado ? (
                          <span className="text-sm">{exp.abogadoAsignado.nombre}</span>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700">
                            Sin asignar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {exp.documentosPendientes > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
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
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFaseDialog(exp)}
                            className="bg-blue-50 hover:bg-blue-100"
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Fase
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedExpediente(exp)
                              setShowAsignarDialog(true)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Asignar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contenido: Abogados */}
      {activeTab === 'abogados' && (
        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-blue-900">Abogados Externos</CardTitle>
              <CardDescription>Gestiona los abogados que colaboran contigo</CardDescription>
            </div>
            <Button onClick={() => setShowAbogadoDialog(true)} className="bg-blue-900 hover:bg-blue-800">
              <UserPlus className="w-4 h-4 mr-2" />
              Nuevo Abogado
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : abogados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay abogados registrados</p>
                <Button onClick={() => setShowAbogadoDialog(true)} className="mt-4">
                  Añadir primer abogado
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Expedientes Asignados</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abogados.map((abog) => (
                    <TableRow key={abog.id}>
                      <TableCell className="font-medium">{abog.nombre}</TableCell>
                      <TableCell>{abog.email}</TableCell>
                      <TableCell>{abog.telefono || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {abog._count.expedientesComoAbogado} expedientes
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={abog.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {abog.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Cambiar Fase */}
      <Dialog open={showFaseDialog} onOpenChange={setShowFaseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cambiar Fase del Expediente</DialogTitle>
            <DialogDescription>
              {selectedExpediente?.referencia} - {selectedExpediente?.cliente.nombre}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Fase actual */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-500">Fase Actual</p>
                <p className="text-3xl font-bold text-blue-900">{selectedExpediente?.faseActual}</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Progreso</p>
                <Progress value={selectedExpediente?.porcentajeAvance || 0} className="h-3 mt-1" />
                <p className="text-right text-sm font-medium mt-1">{selectedExpediente?.porcentajeAvance}%</p>
              </div>
            </div>

            {/* Selector de fase */}
            <div>
              <Label className="text-base font-medium">Seleccionar Nueva Fase</Label>
              <p className="text-sm text-gray-500 mb-3">
                Haz clic en una fase para actualizar el expediente
              </p>
              <TimelineSelector
                faseActual={selectedExpediente?.faseActual || 1}
                onFaseChange={handleCambiarFase}
              />
            </div>

            {/* Información de la fase seleccionada */}
            {selectedExpediente && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">
                  {fasesLSO[selectedExpediente.faseActual - 1]?.nombre}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {fasesLSO[selectedExpediente.faseActual - 1]?.descripcion}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Duración estimada: {fasesLSO[selectedExpediente.faseActual - 1]?.duracion}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Asignar abogado */}
      <Dialog open={showAsignarDialog} onOpenChange={setShowAsignarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Abogado</DialogTitle>
            <DialogDescription>
              Expediente: {selectedExpediente?.referencia} - {selectedExpediente?.cliente.nombre}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Label>Seleccionar abogado</Label>
            <Select
              onValueChange={(value) => handleAsignarAbogado(selectedExpediente?.id || '', value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un abogado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asignar</SelectItem>
                {abogados.filter(a => a.activo).map((abog) => (
                  <SelectItem key={abog.id} value={abog.id}>
                    {abog.nombre} ({abog._count.expedientesComoAbogado} expedientes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Crear abogado */}
      <Dialog open={showAbogadoDialog} onOpenChange={setShowAbogadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Abogado</DialogTitle>
            <DialogDescription>
              Crea una cuenta para un abogado externo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="abog-nombre">Nombre completo *</Label>
              <Input
                id="abog-nombre"
                value={nuevoAbogado.nombre}
                onChange={(e) => setNuevoAbogado({ ...nuevoAbogado, nombre: e.target.value })}
                placeholder="Dr. Nombre Apellidos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abog-email">Email *</Label>
              <Input
                id="abog-email"
                type="email"
                value={nuevoAbogado.email}
                onChange={(e) => setNuevoAbogado({ ...nuevoAbogado, email: e.target.value })}
                placeholder="abogado@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abog-telefono">Teléfono</Label>
              <Input
                id="abog-telefono"
                value={nuevoAbogado.telefono}
                onChange={(e) => setNuevoAbogado({ ...nuevoAbogado, telefono: e.target.value })}
                placeholder="+34 666 123 456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abog-password">Contraseña *</Label>
              <Input
                id="abog-password"
                type="password"
                value={nuevoAbogado.password}
                onChange={(e) => setNuevoAbogado({ ...nuevoAbogado, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowAbogadoDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-blue-900 hover:bg-blue-800"
                onClick={handleCrearAbogado}
                disabled={saving}
              >
                {saving ? 'Creando...' : 'Crear Abogado'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
