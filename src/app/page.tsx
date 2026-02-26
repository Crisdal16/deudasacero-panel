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
import { PerfilUsuario } from '@/components/deudasacero/PerfilUsuario'
import { PagosFacturas } from '@/components/deudasacero/PagosFacturas'
import { PresupuestoSection } from '@/components/deudasacero/PresupuestoSection'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

type Section = 'dashboard' | 'expediente' | 'documentos' | 'mensajes' | 'faq' | 'admin' | 'abogados' | 'perfil' | 'pagos' | 'presupuesto'

interface User {
  id: string
  email: string
  nombre: string
  apellidos?: string
  telefono?: string
  nif?: string
  rol: 'admin' | 'abogado' | 'cliente'
  activo: boolean
  direccion?: string
  codigoPostal?: string
  ciudad?: string
  provincia?: string
  nombreFacturacion?: string
  nifFacturacion?: string
  direccionFacturacion?: string
  numeroColegiado?: string
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
    contenido?: string | null
    nombreArchivo?: string | null
    fase?: number
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
    remitenteNombre?: string
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

interface Presupuesto {
  id: string
  nombre: string
  nombreArchivo?: string | null
  contenido?: string | null
  fechaSubida: string
  estado: string
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
  const [faseActual, setFaseActual] = useState(1)
  const [expedienteId, setExpedienteId] = useState<string | null>(null)
  const [mensajes, setMensajes] = useState<Expediente['mensajes']>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null)
  
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
        if (currentSection === 'presupuesto') {
          fetchPresupuesto()
        }
      } else if (user.rol === 'abogado') {
        // Abogado ve sus expedientes asignados
        if (currentSection === 'dashboard') {
          fetchExpediente()
        }
        if (currentSection === 'mensajes') {
          fetchMensajes()
        }
      } else if (user.rol === 'admin') {
        // Admin puede ver presupuesto
        if (currentSection === 'presupuesto') {
          fetchPresupuesto()
        }
      }
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
      if (data.expediente) {
        setFaseActual(data.expediente.faseActual)
        setExpedienteId(data.expediente.id)
      }
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
      setFaseActual(data.faseActual || 1)
      setExpedienteId(data.expedienteId || null)
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

  const fetchPresupuesto = async () => {
    try {
      const res = await fetch('/api/presupuesto')
      const data = await res.json()
      setPresupuesto(data.presupuesto || null)
    } catch (error) {
      console.error('Error fetching presupuesto:', error)
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
        description: 'Tu cuenta ha sido creada correctamente. Revisa tu email para verificar tu cuenta.',
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
      setPresupuesto(null)
      setCurrentSection('dashboard')
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      })
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleUploadDocumento = async (data: { nombre: string; tipo: string; contenido?: string; nombreArchivo?: string }) => {
    const res = await fetch('/api/documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al subir documento')
    fetchDocumentos()
  }

  const handleUploadPresupuesto = async (data: { nombre: string; contenido: string; nombreArchivo: string }) => {
    const res = await fetch('/api/presupuesto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error al subir presupuesto')
    fetchPresupuesto()
  }

  const handleEnviarMensaje = async (texto: string, archivo?: { nombre: string; contenido: string; tipo: string }) => {
    const res = await fetch('/api/mensajes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, ...archivo }),
    })
    if (!res.ok) throw new Error('Error al enviar mensaje')
    fetchMensajes()
  }

  const handleUpdateProfile = (updatedUser: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : null)
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
      return ['admin', 'presupuesto', 'faq']
    } else if (user.rol === 'abogado') {
      return ['dashboard', 'documentos', 'mensajes', 'perfil', 'faq']
    }
    // Cliente ve presupuesto si está en fase 2
    const sections: Section[] = ['dashboard', 'expediente', 'documentos', 'mensajes', 'perfil', 'pagos', 'faq']
    if (faseActual === 2) {
      sections.splice(2, 0, 'presupuesto')
    }
    return sections
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
          
          {/* PRESUPUESTO - Fase 2 */}
          {currentSection === 'presupuesto' && (
            <PresupuestoSection 
              expedienteId={expedienteId || undefined}
              userRol={user.rol}
              faseActual={faseActual}
              presupuesto={presupuesto}
              onUpload={handleUploadPresupuesto}
              onRefresh={fetchPresupuesto}
            />
          )}
          
          {/* DOCUMENTOS */}
          {user.rol === 'cliente' && currentSection === 'documentos' && (
            <Documentos 
              documentos={documentos}
              checklist={checklist}
              faseActual={faseActual}
              userRol={user.rol}
              expedienteId={expedienteId || undefined}
              onUpload={handleUploadDocumento}
              onRefresh={fetchDocumentos}
            />
          )}
          
          {['cliente', 'abogado'].includes(user.rol) && currentSection === 'mensajes' && (
            <Mensajes 
              mensajes={mensajes}
              onEnviar={handleEnviarMensaje}
              usuarioNombre={user.nombre}
              usuarioRol={user.rol}
            />
          )}
          
          {/* PERFIL - Todos los roles */}
          {currentSection === 'perfil' && (
            <PerfilUsuario 
              user={user}
              onUpdate={handleUpdateProfile}
            />
          )}

          {/* PAGOS Y FACTURAS - Cliente */}
          {user.rol === 'cliente' && currentSection === 'pagos' && (
            <PagosFacturas userRol={user.rol} />
          )}
          
          {currentSection === 'faq' && (
            <FAQSection faqs={faqs} />
          )}
        </div>
      </main>
    </div>
  )
}
