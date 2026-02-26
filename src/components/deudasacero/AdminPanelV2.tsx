'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
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
  Edit,
  Euro,
  UserPlus,
  RefreshCw,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { TimelineSelector, fasesLSO } from './Timeline'

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

interface Cliente {
  id: string
  nombre: string
  email: string
  telefono: string | null
  nif: string | null
  activo: boolean
  ultimoAcceso: string | null
  createdAt: string
  _count: {
    expedientesComoCliente: number
  }
}

export function AdminPanelV2() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [abogados, setAbogados] = useState<Abogado[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null)
  const [showAsignarDialog, setShowAsignarDialog] = useState(false)
  const [showAbogadoDialog, setShowAbogadoDialog] = useState(false)
  const [showClienteDialog, setShowClienteDialog] = useState(false)
  const [showFaseDialog, setShowFaseDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'expedientes' | 'clientes' | 'abogados'>('expedientes')
  const { toast } = useToast()

  // Formulario nuevo abogado
  const [nuevoAbogado, setNuevoAbogado] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
  })

  // Formulario nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    nif: '',
    crearExpediente: true,
    referencia: '',
    tipoProcedimiento: 'persona_fisica',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expRes, abogRes, clientRes] = await Promise.all([
        fetch('/api/expedientes'),
        fetch('/api/admin/abogados'),
        fetch('/api/admin/usuarios?rol=cliente'),
      ])
      const expData = await expRes.json()
      const abogData = await abogRes.json()
      const clientData = await clientRes.json()
      setExpedientes(expData.expedientes || [])
      setAbogados(abogData.abogados || [])
      setClientes(clientData.usuarios || [])
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const stats = {
    totalExpedientes: expedientes.length,
    totalClientes: clientes.length,
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

  const handleCrearCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.email || !nuevoCliente.password) {
      toast({
        title: 'Error',
        description: 'Nombre, email y contraseña son obligatorios',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoCliente),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Error al crear cliente')
      
      toast({
        title: 'Cliente creado',
        description: data.expediente 
          ? `Cliente y expediente ${data.expediente.referencia} creados correctamente`
          : 'El cliente ha sido creado correctamente',
      })
      setNuevoCliente({
        nombre: '', email: '', password: '', telefono: '', nif: '',
        crearExpediente: true, referencia: '', tipoProcedimiento: 'persona_fisica',
      })
      setShowClienteDialog(false)
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el cliente',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const openFaseDialog = (exp: Expediente) => {
    setSelectedExpediente(exp)
    setShowFaseDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona expedientes, clientes y abogados</p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Expedientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{stats.totalExpedientes}</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.totalClientes}</p>
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

        <Card className="border-purple-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensajes Nuevos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{stats.mensajesNuevos}</p>
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
          className={`px-4 py-2 font-medium ${activeTab === 'clientes' ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-500'}`}
          onClick={() => setActiveTab('clientes')}
        >
          Clientes
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

      {/* Contenido: Clientes */}
      {activeTab === 'clientes' && (
        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-blue-900">Clientes</CardTitle>
              <CardDescription>Gestiona los clientes del sistema</CardDescription>
            </div>
            <Button onClick={() => setShowClienteDialog(true)} className="bg-green-600 hover:bg-green-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>NIF</TableHead>
                    <TableHead>Expedientes</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nombre}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>{cliente.telefono || '-'}</TableCell>
                      <TableCell>{cliente.nif || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cliente._count.expedientesComoCliente} expedientes
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cliente.ultimoAcceso ? formatDate(cliente.ultimoAcceso) : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cliente.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
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

      {/* Dialog: Crear cliente */}
      <Dialog open={showClienteDialog} onOpenChange={setShowClienteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Crea una cuenta de cliente y opcionalmente un expediente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cli-nombre">Nombre completo *</Label>
              <Input
                id="cli-nombre"
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                placeholder="Nombre Apellidos"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cli-email">Email *</Label>
                <Input
                  id="cli-email"
                  type="email"
                  value={nuevoCliente.email}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cli-password">Contraseña *</Label>
                <Input
                  id="cli-password"
                  type="password"
                  value={nuevoCliente.password}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cli-telefono">Teléfono</Label>
                <Input
                  id="cli-telefono"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  placeholder="+34 666 123 456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cli-nif">NIF/DNI</Label>
                <Input
                  id="cli-nif"
                  value={nuevoCliente.nif}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nif: e.target.value })}
                  placeholder="12345678A"
                />
              </div>
            </div>

            {/* Opción de crear expediente */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="crear-expediente"
                  checked={nuevoCliente.crearExpediente}
                  onCheckedChange={(checked) => 
                    setNuevoCliente({ ...nuevoCliente, crearExpediente: !!checked })
                  }
                />
                <Label htmlFor="crear-expediente" className="font-medium">
                  Crear expediente automáticamente
                </Label>
              </div>

              {nuevoCliente.crearExpediente && (
                <div className="space-y-3 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="cli-referencia">Referencia (opcional)</Label>
                    <Input
                      id="cli-referencia"
                      value={nuevoCliente.referencia}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, referencia: e.target.value })}
                      placeholder="Se autogenerará si se deja vacío"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cli-tipo">Tipo de procedimiento</Label>
                    <Select
                      value={nuevoCliente.tipoProcedimiento}
                      onValueChange={(value) => 
                        setNuevoCliente({ ...nuevoCliente, tipoProcedimiento: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="persona_fisica">Persona Física</SelectItem>
                        <SelectItem value="autonomo">Autónomo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowClienteDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleCrearCliente}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Cliente'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
