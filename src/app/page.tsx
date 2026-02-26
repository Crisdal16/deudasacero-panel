'use client'

import { useState, useEffect } from 'react'
import { AuthForm } from '@/components/deudasacero/AuthForm'
import { Sidebar } from '@/components/deudasacero/Sidebar'
import { Dashboard } from '@/components/deudasacero/Dashboard'
import { ExpedienteDetalle } from '@/components/deudasacero/ExpedienteDetalle'
import { Documentos } from '@/components/deudasacero/Documentos'
import { Mensajes } from '@/components/deudasacero/Mensajes'
import { FAQSection } from '@/components/deudasacero/FAQ'
import { AdminPanelV2 } from '@/components/deudasacero/AdminPanelV2'
import { AbogadoPanel } from '@/components/deudasacero/AbogadoPanel'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

type Section = 'dashboard' | 'expediente' | 'documentos' | 'mensajes' | 'faq' | 'admin' | 'abogados'

interface User {
  id: string
  email: string
  nombre: string
  rol: 'admin' | 'abogado' | 'cliente'
  activo: boolean
  expedientesAsignados?: number
  expedienteCliente?: {
    id: string
    referencia: string
    faseActual: number
    porcentajeAvance: number
    estado: string
  } | null
}

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
  cliente?: {
    nombre: string
    email: string
    nif: string | null
    telefono: string | null
  }
  deudas: Array<{
    id: string
    tipo: string
    importe: number
    descripcion: string | null
    acreedor: string | null
  }>
  documentos: Array<{
    id: string
    nombre: string
    tipo: string
    estado: string
    esRequerido: boolean
    fechaSubida: string
  }>
  checklist: Array<{
    id: string
    nombre: string
    obligatorio: boolean
    noAplica: boolean
    orden: number
    documentoId: string | null
  }>
  mensajes: Array<{
    id: string
    texto: string
    remitente: string
    fechaEnvio: string
    leido: boolean
  }>
}

interface FAQ {
  id: string
  pregunta: string
  respuesta: string
  orden: number
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState<Section>('dashboard')
  
  const [expediente, setExpediente] = useState<Expediente | null>(null)
  const [documentos, setDocumentos] = useState<Expediente['documentos']>([])
  const [checklist, setChecklist] = useState<Expediente['checklist']>([])
  const [mensajes, setMensajes] = useState<Expediente['mensajes']>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  
  const { toast } = useToast()

  // Verificar sesión al cargar
  useEffect(() => {
    checkSession()
  }, [])

  // Cargar datos según la sección y rol
  useEffect(() => {
    if (user) {
      if (user.rol === 'cliente') {
        // Cliente solo ve su expediente
        if (['dashboard', 'expediente'].includes(currentSection)) {
          fetchExpediente()
        }
        if (currentSection === 'documentos') {
          fetchDocumentos()
        }
        if (currentSection === 'mensajes') {
          fetchMensajes()
        }
        if (currentSection === 'faq') {
          fetchFAQs()
        }
      } else if (user.rol === 'abogado') {
        // Abogado ve sus expedientes asignados
        if (currentSection === 'dashboard') {
          fetchExpediente()
        }
        if (currentSection === 'mensajes') {
          fetchMensajes()
        }
      }
      // Admin no necesita cargar datos en el dashboard
    }
  }, [user, currentSection])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        // Redirigir según rol
        if (data.user.rol === 'admin') {
          setCurrentSection('admin')
        } else if (data.user.rol === 'abogado') {
          setCurrentSection('dashboard')
        } else {
          setCurrentSection('dashboard')
        }
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpediente = async () => {
    try {
      const res = await fetch('/api/expediente')
      const data = await res.json()
      setExpediente(data.expediente)
    } catch (error) {
      console.error('Error fetching expediente:', error)
    }
  }

  const fetchDocumentos = async () => {
    try {
      const res = await fetch('/api/documentos')
      const data = await res.json()
      setDocumentos(data.documentos || [])
      setChecklist(data.checklist || [])
    } catch (error) {
      console.error('Error fetching documentos:', error)
    }
  }

  const fetchMensajes = async () => {
    try {
      const res = await fetch('/api/mensajes')
      const data = await res.json()
      setMensajes(data.mensajes || [])
    } catch (error) {
      console.error('Error fetching mensajes:', error)
    }
  }

  const fetchFAQs = async () => {
    try {
      const res = await fetch('/api/faq')
      const data = await res.json()
      setFaqs(data.faqs || [])
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }
      
      setUser(data.user)
      
      // Redirigir según rol
      if (data.user.rol === 'admin') {
        setCurrentSection('admin')
      } else if (data.user.rol === 'abogado') {
        setCurrentSection('dashboard')
      } else {
        setCurrentSection('dashboard')
      }
      
      toast({
        title: '¡Bienvenido!',
        description: `Has iniciado sesión como ${data.user.nombre}`,
      })
    } catch (error: any) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (data: { nombre: string; email: string; password: string; telefono?: string; nif?: string }) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const responseData = await res.json()
      
      if (!res.ok) {
        throw new Error(responseData.error || 'Error al registrarse')
      }
      
      setUser(responseData.user)
      setCurrentSection('dashboard')
      toast({
        title: '¡Cuenta creada!',
        description: 'Tu cuenta ha sido creada correctamente',
      })
    } catch (error: any) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setExpediente(null)
      setDocumentos([])
      setChecklist([])
      setMensajes([])
      setCurrentSection('dashboard')
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      })
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleUploadDocumento = async (data: { nombre: string; tipo: string }) => {
    const res = await fetch('/api/documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al subir documento')
    fetchDocumentos()
  }

  const handleEnviarMensaje = async (texto: string) => {
    const res = await fetch('/api/mensajes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    })
    if (!res.ok) throw new Error('Error al enviar mensaje')
    fetchMensajes()
  }

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    )
  }

  // Pantalla de autenticación
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <AuthForm
          onLogin={handleLogin}
          onRegister={handleRegister}
          loading={authLoading}
          error={authError}
        />
      </div>
    )
  }

  // Determinar qué secciones mostrar según rol
  const getSections = (): Section[] => {
    if (user.rol === 'admin') {
      return ['admin', 'faq']
    } else if (user.rol === 'abogado') {
      return ['dashboard', 'documentos', 'mensajes', 'faq']
    }
    return ['dashboard', 'expediente', 'documentos', 'mensajes', 'faq']
  }

  // Aplicación principal
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        userName={user.nombre}
        userRol={user.rol}
        onLogout={handleLogout}
        sections={getSections()}
      />
      
      <main className="flex-1 p-4 md:p-8 md:ml-0 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* ADMIN */}
          {user.rol === 'admin' && currentSection === 'admin' && (
            <AdminPanelV2 />
          )}

          {/* ABOGADO */}
          {user.rol === 'abogado' && currentSection === 'dashboard' && (
            <AbogadoPanel onSelectExpediente={(id) => console.log('Selected:', id)} />
          )}

          {/* CLIENTE */}
          {user.rol === 'cliente' && currentSection === 'dashboard' && (
            <Dashboard expediente={expediente} />
          )}
          
          {user.rol === 'cliente' && currentSection === 'expediente' && (
            <ExpedienteDetalle expediente={expediente} />
          )}
          
          {user.rol === 'cliente' && currentSection === 'documentos' && (
            <Documentos 
              documentos={documentos}
              checklist={checklist}
              onUpload={handleUploadDocumento}
            />
          )}
          
          {['cliente', 'abogado'].includes(user.rol) && currentSection === 'mensajes' && (
            <Mensajes 
              mensajes={mensajes}
              onEnviar={handleEnviarMensaje}
              usuarioNombre={user.nombre}
            />
          )}
          
          {currentSection === 'faq' && (
            <FAQSection faqs={faqs} />
          )}
        </div>
      </main>
    </div>
  )
}
