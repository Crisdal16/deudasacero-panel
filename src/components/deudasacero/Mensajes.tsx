'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  MessageSquare, 
  Send, 
  User, 
  Building2,
  Loader2,
  Paperclip,
  Download,
  Eye,
  CheckCheck,
  Check,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Mensaje {
  id: string
  texto: string
  remitente: string
  remitenteNombre?: string
  fechaEnvio: string
  leido: boolean
  archivoNombre?: string | null
  archivoContenido?: string | null
  archivoTipo?: string | null
  destinatario?: string
}

interface MensajesProps {
  mensajes: Mensaje[]
  onEnviar: (texto: string, archivo?: { nombre: string; contenido: string; tipo: string }, destinatario?: string) => Promise<void>
  usuarioNombre: string
  usuarioRol: 'admin' | 'abogado' | 'cliente'
  abogadoNombre?: string
}

export function Mensajes({ 
  mensajes, 
  onEnviar, 
  usuarioNombre, 
  usuarioRol,
  abogadoNombre
}: MensajesProps) {
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<Mensaje | null>(null)
  const [destinatarioSeleccionado, setDestinatarioSeleccionado] = useState<string>('abogado')
  const [showDestinatarioSelector, setShowDestinatarioSelector] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [mensajes])

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)

    if (fecha.toDateString() === hoy.toDateString()) {
      return `Hoy, ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return `Ayer, ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatHoraCorta = (fechaStr: string) => {
    return new Date(fechaStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Archivo demasiado grande',
        description: 'El tamaño máximo para adjuntos es 5MB',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!nuevoMensaje.trim() && !selectedFile) || enviando) return

    setEnviando(true)
    try {
      if (selectedFile && filePreview) {
        // Quitar el prefijo data:*/*;base64, para guardar solo el base64
        const base64Content = filePreview.split(',')[1] || filePreview
        await onEnviar(nuevoMensaje.trim(), {
          nombre: selectedFile.name,
          contenido: base64Content,
          tipo: selectedFile.type,
        }, destinatarioSeleccionado)
      } else {
        await onEnviar(nuevoMensaje.trim(), undefined, destinatarioSeleccionado)
      }
      setNuevoMensaje('')
      removeFile()
      setShowDestinatarioSelector(false)
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive',
      })
    } finally {
      setEnviando(false)
    }
  }

  const handleDownloadAttachment = (msg: Mensaje) => {
    if (!msg.archivoContenido) return
    
    const link = document.createElement('a')
    link.href = msg.archivoContenido
    link.download = msg.archivoNombre || 'archivo'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreviewAttachment = (msg: Mensaje) => {
    setPreviewAttachment(msg)
    setShowPreview(true)
  }

  const getRemitenteInfo = (remitente: string) => {
    switch (remitente) {
      case 'cliente':
        return { label: 'Cliente', color: 'bg-green-600', icon: User }
      case 'abogado':
        return { label: 'Abogado', color: 'bg-blue-600', icon: User }
      case 'admin':
        return { label: 'Administración', color: 'bg-purple-600', icon: Building2 }
      default:
        return { label: remitente, color: 'bg-gray-600', icon: User }
    }
  }

  const isPdf = (tipo: string | null | undefined) => {
    return tipo?.includes('pdf')
  }

  const isImage = (tipo: string | null | undefined) => {
    return tipo?.includes('image')
  }

  // Agrupar mensajes por fecha
  const mensajesAgrupados: { fecha: string; mensajes: Mensaje[] }[] = []
  let fechaActual = ''
  
  mensajes.forEach(msg => {
    const fecha = new Date(msg.fechaEnvio).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
    
    if (fecha !== fechaActual) {
      fechaActual = fecha
      mensajesAgrupados.push({ fecha, mensajes: [msg] })
    } else {
      mensajesAgrupados[mensajesAgrupados.length - 1].mensajes.push(msg)
    }
  })

  // Determinar si el usuario actual es el remitente del mensaje
  const isCurrentUser = (msg: Mensaje) => {
    if (usuarioRol === 'cliente') return msg.remitente === 'cliente'
    if (usuarioRol === 'abogado') return msg.remitente === 'abogado'
    if (usuarioRol === 'admin') return msg.remitente === 'admin'
    return false
  }

  // Obtener opciones de destinatario según el rol
  const getDestinatariosOptions = () => {
    if (usuarioRol === 'cliente') {
      return [
        { value: 'abogado', label: abogadoNombre || 'Mi Abogado', icon: User },
        { value: 'admin', label: 'Administración', icon: Building2 },
      ]
    }
    if (usuarioRol === 'abogado') {
      return [
        { value: 'cliente', label: 'Cliente', icon: User },
        { value: 'admin', label: 'Administración', icon: Building2 },
      ]
    }
    return [
      { value: 'cliente', label: 'Cliente', icon: User },
      { value: 'abogado', label: 'Abogado', icon: User },
    ]
  }

  const destinatarios = getDestinatariosOptions()

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="mb-4 px-4">
        <h1 className="text-2xl font-bold text-blue-900">Mensajes</h1>
        <p className="text-gray-600">
          Comunicación directa con {usuarioRol === 'cliente' ? 'tu despacho' : usuarioRol === 'abogado' ? 'tus clientes y administración' : 'todos los usuarios'}
        </p>
      </div>

      <Card className="flex-1 flex flex-col border-blue-100">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="flex items-center justify-between text-blue-900">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </div>
            
            {/* Selector de destinatario */}
            {usuarioRol !== 'admin' && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-normal text-gray-600">Enviar a:</span>
                <div className="flex gap-1">
                  {destinatarios.map((dest) => {
                    const DestIcon = dest.icon
                    return (
                      <Button
                        key={dest.value}
                        variant={destinatarioSeleccionado === dest.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDestinatarioSeleccionado(dest.value)}
                        className={cn(
                          "text-xs",
                          destinatarioSeleccionado === dest.value && "bg-blue-900 hover:bg-blue-800"
                        )}
                      >
                        <DestIcon className="w-3 h-3 mr-1" />
                        {dest.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea ref={scrollRef} className="h-full">
            <div className="p-4 space-y-4">
              {mensajes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                  <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
                  <p>No hay mensajes todavía</p>
                  <p className="text-sm">Envía un mensaje para iniciar la conversación</p>
                </div>
              ) : (
                mensajesAgrupados.map((grupo, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-center">
                      <Badge variant="outline" className="bg-gray-100 text-gray-600 font-normal">
                        {grupo.fecha}
                      </Badge>
                    </div>
                    
                    {grupo.mensajes.map((msg) => {
                      const isOwn = isCurrentUser(msg)
                      const remitenteInfo = getRemitenteInfo(msg.remitente)
                      const RemitenteIcon = remitenteInfo.icon
                      
                      return (
                        <div 
                          key={msg.id}
                          className={cn("flex gap-3", isOwn ? "justify-end" : "justify-start")}
                        >
                          {!isOwn && (
                            <Avatar className={cn("w-8 h-8", remitenteInfo.color)}>
                              <AvatarFallback className={cn(remitenteInfo.color, "text-white")}>
                                <RemitenteIcon className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={cn(
                            "max-w-[70%]",
                            isOwn 
                              ? "bg-green-600 text-white rounded-2xl rounded-br-sm" 
                              : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm",
                            "p-3"
                          )}>
                            {/* Nombre del remitente */}
                            {!isOwn && msg.remitenteNombre && (
                              <p className="text-xs font-medium text-blue-600 mb-1">
                                {msg.remitenteNombre}
                                {msg.destinatario && (
                                  <span className="text-gray-400 ml-2">
                                    → {msg.destinatario === 'admin' ? 'Administración' : msg.destinatario === 'abogado' ? 'Abogado' : 'Cliente'}
                                  </span>
                                )}
                              </p>
                            )}
                            
                            <p className="text-sm">{msg.texto}</p>
                            
                            {/* Adjunto */}
                            {msg.archivoContenido && (
                              <div className={cn(
                                "mt-2 p-2 rounded-lg flex items-center gap-2",
                                isOwn ? "bg-green-700" : "bg-gray-200"
                              )}>
                                <Paperclip className="w-4 h-4" />
                                <span className="text-sm flex-1 truncate">
                                  {msg.archivoNombre}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn("h-6 w-6 p-0", isOwn && "text-white hover:bg-green-600")}
                                  onClick={() => handlePreviewAttachment(msg)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn("h-6 w-6 p-0", isOwn && "text-white hover:bg-green-600")}
                                  onClick={() => handleDownloadAttachment(msg)}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            
                            <div className={cn(
                              "flex items-center justify-end gap-1 mt-1",
                              isOwn ? "text-green-100" : "text-gray-500"
                            )}>
                              <span className="text-xs">
                                {formatHoraCorta(msg.fechaEnvio)}
                              </span>
                              {isOwn && (
                                msg.leido 
                                  ? <CheckCheck className="w-3 h-3" />
                                  : <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                          
                          {isOwn && (
                            <Avatar className="w-8 h-8 bg-green-600">
                              <AvatarFallback className="bg-green-600 text-white">
                                {usuarioNombre.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Preview del archivo seleccionado */}
        {selectedFile && filePreview && (
          <div className="border-t p-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
              <Button variant="ghost" size="sm" onClick={removeFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleEnviar} className="border-t p-4 flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={enviando}
            title="Adjuntar archivo"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            placeholder={`Escribe tu mensaje para ${destinatarioSeleccionado === 'admin' ? 'Administración' : destinatarioSeleccionado === 'abogado' ? 'tu abogado' : 'el cliente'}...`}
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            disabled={enviando}
            className="flex-1"
          />
          <Button 
            type="submit" 
            className="bg-blue-900 hover:bg-blue-800" 
            disabled={enviando || (!nuevoMensaje.trim() && !selectedFile)}
          >
            {enviando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </Card>

      {/* Modal de preview de adjunto */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewAttachment?.archivoNombre}</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[60vh]">
            {previewAttachment?.archivoContenido && isImage(previewAttachment.archivoTipo) && (
              <img 
                src={previewAttachment.archivoContenido} 
                alt={previewAttachment.archivoNombre || 'Preview'}
                className="max-w-full mx-auto"
              />
            )}
            {previewAttachment?.archivoContenido && isPdf(previewAttachment.archivoTipo) && (
              <iframe
                src={previewAttachment.archivoContenido}
                className="w-full h-[60vh]"
                title={previewAttachment.archivoNombre || 'Preview'}
              />
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
            {previewAttachment && (
              <Button onClick={() => handleDownloadAttachment(previewAttachment)}>
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
}
