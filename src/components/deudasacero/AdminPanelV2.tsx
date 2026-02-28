'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Loader2,
  Send,
  Building2,
  CreditCard,
  Receipt,
  Plus,
  Eye,
  Download,
  CheckCircle,
  AlertCircle,
  Trash2,
  XCircle
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
  pagosPendientes: number
  mensajesNuevos: number
  facturacion?: {
    id: string
    importePresupuestado: number
    importeFacturado: number
    estado: string
  } | null
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

interface Mensaje {
  id: string
  texto: string
  remitente: string
  remitenteNombre?: string
  fechaEnvio: string
  leido: boolean
  destinatario?: string | null
  archivoNombre?: string | null
  archivoContenido?: string | null
  archivoTipo?: string | null
}

interface Factura {
  id: string
  numero: string
  importe: number
  concepto: string
  estado: string
  fechaEmision: string
  fechaVencimiento?: string | null
  usuarioId: string
  expedienteId?: string | null
  usuario?: {
    nombre: string
    email: string
  }
  expediente?: {
    referencia: string
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
  const [showMensajesDialog, setShowMensajesDialog] = useState(false)
  const [showFacturacionDialog, setShowFacturacionDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'expedientes' | 'clientes' | 'abogados' | 'mensajes' | 'facturas'>('expedientes')
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)
  const [destinatarioMensaje, setDestinatarioMensaje] = useState<'cliente' | 'abogado'>('cliente')
  const [totalPagosPendientes, setTotalPagosPendientes] = useState(0)
  const [facturasPendientes, setFacturasPendientes] = useState<Factura[]>([])
  const [todasFacturas, setTodasFacturas] = useState<Factura[]>([])
  const [metodoPagoConfirmacion, setMetodoPagoConfirmacion] = useState<string>('transferencia')
  const [showConfirmarPagoDialog, setShowConfirmarPagoDialog] = useState(false)
  const [facturaAPagar, setFacturaAPagar] = useState<Factura | null>(null)
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

  // Formulario factura
  const [nuevaFactura, setNuevaFactura] = useState({
    numero: '',
    importe: '',
    concepto: '',
    fechaVencimiento: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expRes, abogRes, clientRes, pagosRes, facturasRes] = await Promise.all([
        fetch('/api/expedientes'),
        fetch('/api/admin/abogados'),
        fetch('/api/admin/usuarios?rol=cliente'),
        fetch('/api/admin/pagos-pendientes'),
        fetch('/api/facturas'),
      ])
      const expData = await expRes.json()
      const abogData = await abogRes.json()
      const clientData = await clientRes.json()
      const pagosData = await pagosRes.json()
      const facturasData = await facturasRes.json()
      
      setExpedientes(expData.expedientes || [])
      setAbogados(abogData.abogados || [])
      setClientes(clientData.usuarios || [])
      
      if (pagosData.resumen) {
        setTotalPagosPendientes(pagosData.resumen.totalFacturasPendientes || 0)
        setFacturasPendientes(pagosData.facturasPendientes || [])
      }
      
      setTodasFacturas(facturasData.facturas || [])
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
    pagosPendientes: totalPagosPendientes,
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

  const openMensajesDialog = async (exp: Expediente) => {
    setSelectedExpediente(exp)
    setShowMensajesDialog(true)
    // Cargar mensajes
    try {
      const res = await fetch(`/api/mensajes?expedienteId=${exp.id}`)
      const data = await res.json()
      setMensajes(data.mensajes || [])
    } catch (error) {
      console.error('Error cargando mensajes:', error)
    }
  }

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !selectedExpediente) return

    setEnviandoMensaje(true)
    try {
      const res = await fetch('/api/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: nuevoMensaje.trim(),
          expedienteId: selectedExpediente.id,
          destinatario: destinatarioMensaje,
        }),
      })
      
      if (!res.ok) throw new Error('Error al enviar mensaje')
      
      setNuevoMensaje('')
      // Recargar mensajes
      const msgRes = await fetch(`/api/mensajes?expedienteId=${selectedExpediente.id}`)
      const msgData = await msgRes.json()
      setMensajes(msgData.mensajes || [])
      
      toast({
        title: 'Mensaje enviado',
        description: `El mensaje ha sido enviado a ${destinatarioMensaje === 'abogado' ? 'el abogado' : 'el cliente'}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive',
      })
    } finally {
      setEnviandoMensaje(false)
    }
  }

  const openFacturacionDialog = (exp: Expediente) => {
    setSelectedExpediente(exp)
    // Generar número de factura automático
    const year = new Date().getFullYear()
    const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setNuevaFactura({
      numero: `F${year}-${num}`,
      importe: '',
      concepto: `Servicios LSO - ${exp.referencia}`,
      fechaVencimiento: '',
    })
    setShowFacturacionDialog(true)
  }

  const handleCrearFactura = async () => {
    if (!nuevaFactura.numero || !nuevaFactura.importe || !nuevaFactura.concepto) {
      toast({
        title: 'Error',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: selectedExpediente?.cliente.id,
          expedienteId: selectedExpediente?.id,
          numero: nuevaFactura.numero,
          importe: parseFloat(nuevaFactura.importe),
          concepto: nuevaFactura.concepto,
          fechaVencimiento: nuevaFactura.fechaVencimiento || null,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear factura')
      }
      
      toast({
        title: 'Factura creada',
        description: `La factura ${nuevaFactura.numero} ha sido creada correctamente`,
      })
      setShowFacturacionDialog(false)
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la factura',
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

  // Descargar factura
  const handleDownloadFactura = async (facturaId: string, numero: string) => {
    try {
      const res = await fetch(`/api/facturas/${facturaId}/download`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Error al descargar')
      
      // Crear enlace de descarga
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${data.contenido}`
      link.download = `factura-${numero}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: 'Descargando factura',
        description: `La factura ${numero} se está descargando`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo descargar la factura',
        variant: 'destructive',
      })
    }
  }

  // Confirmar pago de factura - abre diálogo
  const openConfirmarPagoDialog = (factura: Factura) => {
    setFacturaAPagar(factura)
    setMetodoPagoConfirmacion('transferencia')
    setShowConfirmarPagoDialog(true)
  }

  // Ejecutar confirmación de pago
  const handleConfirmarPago = async () => {
    if (!facturaAPagar) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/facturas/${facturaAPagar.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estado: 'pagada',
          metodoPago: metodoPagoConfirmacion 
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al confirmar pago')
      }
      
      toast({
        title: 'Pago confirmado',
        description: `La factura ${facturaAPagar.numero} ha sido marcada como pagada`,
      })
      setShowConfirmarPagoDialog(false)
      setFacturaAPagar(null)
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo confirmar el pago',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Anular factura
  const handleAnularFactura = async (facturaId: string, numero: string) => {
    if (!confirm('¿Estás seguro de que deseas anular esta factura?')) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/facturas/${facturaId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al anular')
      }
      
      toast({
        title: 'Factura anulada',
        description: `La factura ${numero} ha sido anulada`,
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo anular la factura',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Eliminar usuario (cliente o abogado)
  const handleEliminarUsuario = async (usuarioId: string, nombre: string, rol: 'cliente' | 'abogado') => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a "${nombre}"?\n\nEsta acción no se puede deshacer.`)) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar')
      }
      
      toast({
        title: `${rol === 'cliente' ? 'Cliente' : 'Abogado'} eliminado`,
        description: data.message || `El ${rol} ha sido eliminado correctamente`,
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `No se pudo eliminar el ${rol}`,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Activar/Desactivar usuario
  const handleToggleUsuario = async (usuarioId: string, activo: boolean, nombre: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar')
      }
      
      toast({
        title: activo ? 'Usuario activado' : 'Usuario desactivado',
        description: `${nombre} ha sido ${activo ? 'activado' : 'desactivado'} correctamente`,
      })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el usuario',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Obtener badge de estado de factura
  const getEstadoFacturaBadge = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pagada</Badge>
      case 'vencida':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Vencida</Badge>
      case 'anulada':
        return <Badge variant="outline" className="bg-gray-100 text-gray-600"><Trash2 className="w-3 h-3 mr-1" />Anulada</Badge>
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona expedientes, clientes, abogados y facturación</p>
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
              <Euro className="w-4 h-4" />
              Pagos Pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.pagosPendientes)}</p>
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
              <CreditCard className="w-4 h-4" />
              Deuda Total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.deudaTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="expedientes">Expedientes</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="abogados">Abogados</TabsTrigger>
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
        </TabsList>

        {/* Contenido: Expedientes */}
        <TabsContent value="expedientes">
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
                      <TableHead>Pagos Pendientes</TableHead>
                      <TableHead>Abogado</TableHead>
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
                          {exp.facturacion ? (
                            <div className="text-sm">
                              <p className="font-medium text-yellow-600">
                                {formatCurrency(exp.facturacion.importePresupuestado - exp.facturacion.importeFacturado)}
                              </p>
                              <p className="text-xs text-gray-500">
                                de {formatCurrency(exp.facturacion.importePresupuestado)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openFaseDialog(exp)}
                              className="bg-blue-50 hover:bg-blue-100"
                              title="Cambiar fase"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedExpediente(exp)
                                setShowAsignarDialog(true)
                              }}
                              title="Asignar abogado"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openMensajesDialog(exp)}
                              className="bg-purple-50 hover:bg-purple-100"
                              title="Mensajes"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openFacturacionDialog(exp)}
                              className="bg-green-50 hover:bg-green-100"
                              title="Facturación"
                            >
                              <Receipt className="w-4 h-4" />
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
        </TabsContent>

        {/* Contenido: Clientes */}
        <TabsContent value="clientes">
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
              ) : clientes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay clientes registrados</p>
                  <Button onClick={() => setShowClienteDialog(true)} className="mt-4">
                    Añadir primer cliente
                  </Button>
                </div>
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
                      <TableHead>Acciones</TableHead>
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
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUsuario(cliente.id, !cliente.activo, cliente.nombre)}
                              title={cliente.activo ? 'Desactivar' : 'Activar'}
                              disabled={saving}
                            >
                              {cliente.activo ? (
                                <XCircle className="w-4 h-4 text-orange-600" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEliminarUsuario(cliente.id, cliente.nombre, 'cliente')}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              title="Eliminar cliente"
                              disabled={saving}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* Contenido: Abogados */}
        <TabsContent value="abogados">
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
                      <TableHead>Acciones</TableHead>
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
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUsuario(abog.id, !abog.activo, abog.nombre)}
                              title={abog.activo ? 'Desactivar' : 'Activar'}
                              disabled={saving}
                            >
                              {abog.activo ? (
                                <XCircle className="w-4 h-4 text-orange-600" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEliminarUsuario(abog.id, abog.nombre, 'abogado')}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              title="Eliminar abogado"
                              disabled={saving}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* Contenido: Facturas */}
        <TabsContent value="facturas">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Gestión de Facturas
              </CardTitle>
              <CardDescription>
                Gestiona todas las facturas, confirma pagos y descarga documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : todasFacturas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay facturas registradas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Expediente</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Importe</TableHead>
                      <TableHead>Fecha Emisión</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todasFacturas.map((factura) => (
                      <TableRow key={factura.id}>
                        <TableCell className="font-medium">{factura.numero}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{factura.usuario?.nombre || '-'}</p>
                            <p className="text-xs text-gray-500">{factura.usuario?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{factura.expediente?.referencia || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{factura.concepto}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(factura.importe)}</TableCell>
                        <TableCell>{formatDate(factura.fechaEmision)}</TableCell>
                        <TableCell>{getEstadoFacturaBadge(factura.estado)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFactura(factura.id, factura.numero)}
                              title="Descargar factura"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Descargar
                            </Button>
                            {factura.estado === 'emitida' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => openConfirmarPagoDialog(factura)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  disabled={saving}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirmar Pago
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAnularFactura(factura.id, factura.numero)}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  disabled={saving}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Anular
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenido: Mensajes */}
        <TabsContent value="mensajes">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Mensajes por Expediente</CardTitle>
              <CardDescription>
                Selecciona un expediente para enviar mensajes al cliente o abogado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expediente</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Abogado</TableHead>
                      <TableHead>Mensajes Nuevos</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expedientes.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-medium">{exp.referencia}</TableCell>
                        <TableCell>{exp.cliente.nombre}</TableCell>
                        <TableCell>{exp.abogadoAsignado?.nombre || '-'}</TableCell>
                        <TableCell>
                          {exp.mensajesNuevos > 0 ? (
                            <Badge className="bg-purple-100 text-purple-800">
                              {exp.mensajesNuevos} nuevos
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMensajesDialog(exp)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Ver Chat
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Dialog: Mensajes */}
      <Dialog open={showMensajesDialog} onOpenChange={setShowMensajesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Mensajes - {selectedExpediente?.referencia}</DialogTitle>
            <DialogDescription>
              Cliente: {selectedExpediente?.cliente.nombre}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-[400px]">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {mensajes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay mensajes</p>
                  </div>
                ) : (
                  mensajes.map((msg) => {
                    const isOwn = msg.remitente === 'admin'
                    return (
                      <div 
                        key={msg.id}
                        className={cn("flex gap-3", isOwn ? "justify-end" : "justify-start")}
                      >
                        {!isOwn && (
                          <Avatar className={cn("w-8 h-8", msg.remitente === 'abogado' ? 'bg-blue-600' : 'bg-green-600')}>
                            <AvatarFallback className={cn(msg.remitente === 'abogado' ? 'bg-blue-600' : 'bg-green-600', "text-white")}>
                              {msg.remitente === 'abogado' ? 'A' : 'C'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "max-w-[70%] p-3",
                          isOwn 
                            ? "bg-purple-600 text-white rounded-2xl rounded-br-sm" 
                            : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm"
                        )}>
                          <p className="text-sm">{msg.texto}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.fechaEnvio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {isOwn && (
                          <Avatar className="w-8 h-8 bg-purple-600">
                            <AvatarFallback className="bg-purple-600 text-white">
                              <Building2 className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
            
            <form onSubmit={(e) => { e.preventDefault(); handleEnviarMensaje(); }} className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Enviar a:</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={destinatarioMensaje === 'cliente' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDestinatarioMensaje('cliente')}
                    className={destinatarioMensaje === 'cliente' ? 'bg-blue-900 hover:bg-blue-800' : ''}
                  >
                    Cliente
                  </Button>
                  <Button
                    type="button"
                    variant={destinatarioMensaje === 'abogado' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDestinatarioMensaje('abogado')}
                    className={destinatarioMensaje === 'abogado' ? 'bg-blue-900 hover:bg-blue-800' : ''}
                  >
                    Abogado
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe tu mensaje..."
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  disabled={enviandoMensaje}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700" 
                  disabled={enviandoMensaje || !nuevoMensaje.trim()}
                >
                  {enviandoMensaje ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Crear Factura */}
      <Dialog open={showFacturacionDialog} onOpenChange={setShowFacturacionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Factura</DialogTitle>
            <DialogDescription>
              Expediente: {selectedExpediente?.referencia} - Cliente: {selectedExpediente?.cliente.nombre}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fact-numero">Número de Factura *</Label>
              <Input
                id="fact-numero"
                value={nuevaFactura.numero}
                onChange={(e) => setNuevaFactura({ ...nuevaFactura, numero: e.target.value })}
                placeholder="F2024-0001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fact-importe">Importe (€) *</Label>
              <Input
                id="fact-importe"
                type="number"
                step="0.01"
                value={nuevaFactura.importe}
                onChange={(e) => setNuevaFactura({ ...nuevaFactura, importe: e.target.value })}
                placeholder="1500.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fact-concepto">Concepto *</Label>
              <Input
                id="fact-concepto"
                value={nuevaFactura.concepto}
                onChange={(e) => setNuevaFactura({ ...nuevaFactura, concepto: e.target.value })}
                placeholder="Servicios LSO"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fact-vencimiento">Fecha de Vencimiento</Label>
              <Input
                id="fact-vencimiento"
                type="date"
                value={nuevaFactura.fechaVencimiento}
                onChange={(e) => setNuevaFactura({ ...nuevaFactura, fechaVencimiento: e.target.value })}
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowFacturacionDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleCrearFactura}
                disabled={saving}
              >
                {saving ? 'Creando...' : 'Crear Factura'}
              </Button>
            </div>
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
              <Label htmlFor="abog-telefono">Télefono</Label>
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

      {/* Dialog: Confirmar Pago */}
      <Dialog open={showConfirmarPagoDialog} onOpenChange={setShowConfirmarPagoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pago de Factura</DialogTitle>
            <DialogDescription>
              {facturaAPagar && (
                <span>
                  Factura <strong>{facturaAPagar.numero}</strong> - {formatCurrency(facturaAPagar.importe)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                Al confirmar el pago, se marcará la factura como <strong>pagada</strong> y 
                se actualizará el historial de pagos del cliente.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metodo-pago">Método de Pago</Label>
              <Select
                value={metodoPagoConfirmacion}
                onValueChange={setMetodoPagoConfirmacion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="bizum">Bizum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowConfirmarPagoDialog(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleConfirmarPago}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Pago
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
