'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
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
import { useToast } from '@/hooks/use-toast'
import { 
  FileText, 
  Users, 
  MessageSquare, 
  Clock,
  Euro,
  Eye,
  RefreshCw,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Expediente {
  id: string
  referencia: string
  juzgado: string | null
  faseActual: number
  porcentajeAvance: number
  estado: string
  tipoProcedimiento: string
  cliente: {
    id: string
    nombre: string
    email: string
    telefono: string | null
    nif: string | null
  }
  deudas: Array<{
    id: string
    tipo: string
    importe: number
    acreedor: string | null
  }>
  documentos: Array<{
    id: string
    nombre: string
    tipo: string
    estado: string
    fechaSubida: string | null
    nombreArchivo: string | null
  }>
  mensajes: Array<{
    id: string
    texto: string
    remitente: string
    remitenteNombre?: string
    fechaEnvio: string
    leido: boolean
  }>
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

export function AbogadoPanel() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'detail' | 'documentos' | 'mensajes'>('list')
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)
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

  const fetchExpedienteDetalle = async (id: string) => {
    try {
      const res = await fetch(`/api/expedientes/${id}`)
      const data = await res.json()
      if (data.expediente) {
        setSelectedExpediente({
          ...data.expediente,
          documentos: data.expediente.documentos || [],
          mensajes: data.expediente.mensajes || [],
          deudas: data.expediente.deudas || [],
        })
      }
    } catch (error) {
      console.error('Error fetching expediente detail:', error)
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

  const formatHora = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const stats = {
    totalExpedientes: expedientes.length,
    documentosPendientes: expedientes.reduce((sum, e) => sum + e.documentosPendientes, 0),
    mensajesNuevos: expedientes.reduce((sum, e) => sum + e.mensajesNuevos, 0),
    deudaTotal: expedientes.reduce((sum, e) => sum + e.deudaTotal, 0),
  }

  const handleSelectExpediente = async (exp: Expediente) => {
    await fetchExpedienteDetalle(exp.id)
    setView('detail')
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
        }),
      })
      
      if (!res.ok) throw new Error('Error al enviar mensaje')
      
      setNuevoMensaje('')
      await fetchExpedienteDetalle(selectedExpediente.id)
      
      toast({
        title: 'Mensaje enviado',
        description: 'El mensaje ha sido enviado correctamente',
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

  const handleCambiarEstadoDocumento = async (docId: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/documentos/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      
      if (!res.ok) throw new Error('Error al actualizar documento')
      
      if (selectedExpediente) {
        await fetchExpedienteDetalle(selectedExpediente.id)
      }
      
      toast({
        title: 'Documento actualizado',
        description: 'El estado del documento ha sido actualizado',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el documento',
        variant: 'destructive',
      })
    }
  }

  // Vista: Lista de expedientes
  if (view === 'list') {
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
                          onClick={() => handleSelectExpediente(exp)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Gestionar
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

  // Vista: Detalle del expediente
  if (!selectedExpediente) return null

  return (
    <div className="space-y-6">
      {/* Header con botón volver */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setView('list')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-blue-900">{selectedExpediente.referencia}</h1>
          <p className="text-gray-600">{selectedExpediente.cliente.nombre}</p>
        </div>
      </div>

      {/* Tabs internos */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${view === 'detail' ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-500'}`}
          onClick={() => setView('detail')}
        >
          Resumen
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center gap-2 ${view === 'documentos' ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-500'}`}
          onClick={() => setView('documentos')}
        >
          Documentos
          {selectedExpediente.documentosPendientes > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              {selectedExpediente.documentosPendientes}
            </Badge>
          )}
        </button>
        <button
          className={`px-4 py-2 font-medium flex items-center gap-2 ${view === 'mensajes' ? 'text-blue-900 border-b-2 border-blue-900' : 'text-gray-500'}`}
          onClick={() => setView('mensajes')}
        >
          Mensajes
          {selectedExpediente.mensajesNuevos > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {selectedExpediente.mensajesNuevos}
            </Badge>
          )}
        </button>
      </div>

      {/* Contenido: Resumen */}
      {view === 'detail' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info del cliente */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                <Users className="w-5 h-5" />
                Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{selectedExpediente.cliente.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">NIF</p>
                  <p className="font-medium">{selectedExpediente.cliente.nif || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedExpediente.cliente.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{selectedExpediente.cliente.telefono || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info del expediente */}
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                <FileText className="w-5 h-5" />
                Datos del Expediente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Referencia</p>
                  <p className="font-medium">{selectedExpediente.referencia}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fase Actual</p>
                  <Badge>Fase {selectedExpediente.faseActual}: {fases[selectedExpediente.faseActual - 1]?.nombre}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium">{selectedExpediente.tipoProcedimiento === 'persona_fisica' ? 'Persona Física' : 'Autónomo'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Progreso</p>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedExpediente.porcentajeAvance} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{selectedExpediente.porcentajeAvance}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deudas */}
          <Card className="border-red-100 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-900">
                <Euro className="w-5 h-5" />
                Deudas ({formatCurrency(selectedExpediente.deudaTotal)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acreedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedExpediente.deudas.map((deuda) => (
                    <TableRow key={deuda.id}>
                      <TableCell>{deuda.acreedor || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {deuda.tipo === 'financiera' ? 'Financiera' :
                           deuda.tipo === 'publica' ? 'Pública' :
                           deuda.tipo === 'proveedores' ? 'Proveedores' : deuda.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(deuda.importe)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenido: Documentos */}
      {view === 'documentos' && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-900">Documentos del Expediente</CardTitle>
            <CardDescription>
              Revisa y aprueba los documentos subidos por el cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedExpediente.documentos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay documentos subidos</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedExpediente.documentos.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.nombre}</p>
                            {doc.nombreArchivo && (
                              <p className="text-xs text-gray-500">{doc.nombreArchivo}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        {doc.fechaSubida ? formatDate(doc.fechaSubida) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          doc.estado === 'revisado' ? 'bg-green-100 text-green-800' :
                          doc.estado === 'subido' ? 'bg-blue-100 text-blue-800' :
                          doc.estado === 'incorrecto' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {doc.estado === 'revisado' ? 'Revisado ✓' :
                           doc.estado === 'subido' ? 'Subido' :
                           doc.estado === 'incorrecto' ? 'Incorrecto' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {doc.estado === 'subido' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 hover:bg-green-100 text-green-700"
                                onClick={() => handleCambiarEstadoDocumento(doc.id, 'revisado')}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 hover:bg-red-100 text-red-700"
                                onClick={() => handleCambiarEstadoDocumento(doc.id, 'incorrecto')}
                              >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Rechazar
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
      )}

      {/* Contenido: Mensajes */}
      {view === 'mensajes' && (
        <div className="flex flex-col h-[calc(100vh-300px)]">
          <Card className="flex-1 flex flex-col border-blue-100">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <MessageSquare className="w-5 h-5" />
                Chat con {selectedExpediente.cliente.nombre}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                  {selectedExpediente.mensajes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay mensajes</p>
                    </div>
                  ) : (
                    selectedExpediente.mensajes.map((msg) => {
                      const isOwn = msg.remitente === 'abogado'
                      return (
                        <div 
                          key={msg.id}
                          className={cn("flex gap-3", isOwn ? "justify-end" : "justify-start")}
                        >
                          {!isOwn && (
                            <Avatar className="w-8 h-8 bg-green-600">
                              <AvatarFallback className="bg-green-600 text-white">
                                {msg.remitenteNombre?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={cn(
                            "max-w-[70%] p-3",
                            isOwn 
                              ? "bg-blue-600 text-white rounded-2xl rounded-br-sm" 
                              : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm"
                          )}>
                            <p className="text-sm">{msg.texto}</p>
                            
                            <div className={cn(
                              "flex items-center justify-end gap-1 mt-1",
                              isOwn ? "text-blue-100" : "text-gray-500"
                            )}>
                              <span className="text-xs">{formatHora(msg.fechaEnvio)}</span>
                            </div>
                          </div>
                          
                          {isOwn && (
                            <Avatar className="w-8 h-8 bg-blue-600">
                              <AvatarFallback className="bg-blue-600 text-white">A</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <form onSubmit={(e) => { e.preventDefault(); handleEnviarMensaje(); }} className="border-t p-4 flex gap-2">
              <Input
                placeholder="Escribe tu mensaje..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                disabled={enviandoMensaje}
                className="flex-1"
              />
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700" 
                disabled={enviandoMensaje || !nuevoMensaje.trim()}
              >
                {enviandoMensaje ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
