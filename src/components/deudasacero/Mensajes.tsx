'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send, 
  User, 
  Building2,
  Loader2
} from 'lucide-react'

interface Mensaje {
  id: string
  texto: string
  remitente: string
  fechaEnvio: string
  leido: boolean
}

interface MensajesProps {
  mensajes: Mensaje[]
  onEnviar: (texto: string) => Promise<void>
  usuarioNombre: string
}

export function Mensajes({ mensajes, onEnviar, usuarioNombre }: MensajesProps) {
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoMensaje.trim() || enviando) return

    setEnviando(true)
    try {
      await onEnviar(nuevoMensaje.trim())
      setNuevoMensaje('')
    } catch (error) {
      console.error('Error enviando mensaje:', error)
    } finally {
      setEnviando(false)
    }
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

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-blue-900">Mensajes</h1>
        <p className="text-gray-600">Comunicación directa con tu despacho</p>
      </div>

      <Card className="flex-1 flex flex-col border-blue-100">
        <CardHeader className="border-b bg-gray-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <MessageSquare className="w-5 h-5" />
            Chat con el Despacho
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          <div 
            ref={scrollRef}
            className="h-full overflow-y-auto p-4 space-y-4"
          >
            {mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
                  
                  {grupo.mensajes.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex gap-3 ${msg.remitente === 'cliente' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.remitente === 'despacho' && (
                        <Avatar className="w-8 h-8 bg-blue-900">
                          <AvatarFallback className="bg-blue-900 text-white">
                            <Building2 className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${
                        msg.remitente === 'cliente' 
                          ? 'bg-green-600 text-white rounded-2xl rounded-br-sm' 
                          : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                      } p-3`}>
                        <p className="text-sm">{msg.texto}</p>
                        <p className={`text-xs mt-1 ${
                          msg.remitente === 'cliente' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {formatFecha(msg.fechaEnvio)}
                        </p>
                      </div>
                      
                      {msg.remitente === 'cliente' && (
                        <Avatar className="w-8 h-8 bg-green-600">
                          <AvatarFallback className="bg-green-600 text-white">
                            {usuarioNombre.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </CardContent>

        <form onSubmit={handleEnviar} className="border-t p-4 flex gap-2">
          <Input
            placeholder="Escribe tu mensaje..."
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            disabled={enviando}
            className="flex-1"
          />
          <Button type="submit" className="bg-blue-900 hover:bg-blue-800" disabled={enviando || !nuevoMensaje.trim()}>
            {enviando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </Card>
    </div>
  )
}
