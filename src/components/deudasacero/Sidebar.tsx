'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  MessageSquare, 
  HelpCircle,
  LogOut,
  Menu,
  X,
  Settings,
  User,
  CreditCard,
  FileCheck
} from 'lucide-react'

type Section = 'dashboard' | 'expediente' | 'documentos' | 'mensajes' | 'faq' | 'admin' | 'abogados' | 'perfil' | 'pagos' | 'facturas'

interface SidebarProps {
  currentSection: Section
  onSectionChange: (section: Section) => void
  userName: string
  userRol: string
  onLogout: () => void
  sections?: Section[]
}

const allMenuItems = [
  { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'expediente' as Section, label: 'Mi Expediente', icon: FileText },
  { id: 'documentos' as Section, label: 'Documentos', icon: Upload },
  { id: 'mensajes' as Section, label: 'Mensajes', icon: MessageSquare },
  { id: 'pagos' as Section, label: 'Mis Pagos', icon: CreditCard },
  { id: 'facturas' as Section, label: 'Facturas', icon: FileCheck },
  { id: 'perfil' as Section, label: 'Mi Perfil', icon: User },
  { id: 'faq' as Section, label: 'Ayuda', icon: HelpCircle },
  { id: 'admin' as Section, label: 'Administración', icon: Settings },
]

function getRolLabel(rol: string) {
  switch (rol) {
    case 'admin': return 'Administrador'
    case 'abogado': return 'Abogado'
    default: return 'Cliente'
  }
}

function getRolColor(rol: string) {
  switch (rol) {
    case 'admin': return 'bg-purple-100 text-purple-800'
    case 'abogado': return 'bg-blue-100 text-blue-800'
    default: return 'bg-green-100 text-green-800'
  }
}

function getAvatarColor(rol: string) {
  switch (rol) {
    case 'admin': return 'bg-purple-600'
    case 'abogado': return 'bg-blue-600'
    default: return 'bg-green-600'
  }
}

export function Sidebar({ 
  currentSection, 
  onSectionChange, 
  userName, 
  userRol, 
  onLogout,
  sections 
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = sections 
    ? allMenuItems.filter(item => sections.includes(item.id))
    : allMenuItems

  const handleSectionClick = (sectionId: Section) => {
    onSectionChange(sectionId)
    setMobileOpen(false)
  }

  const renderMenuItems = () => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = currentSection === item.id
        return (
          <li key={item.id}>
            <button
              onClick={() => handleSectionClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-blue-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-900 to-green-600 flex items-center justify-center">
            <span className="text-xl font-bold text-white">D</span>
          </div>
          <div>
            <h1 className="font-bold text-blue-900">Deudas a Cero</h1>
            <p className="text-xs text-gray-500">
              {userRol === 'admin' ? 'Panel Admin' : 'Área Cliente'}
            </p>
          </div>
        </div>
      </div>

      {/* Usuario */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className={`w-10 h-10 ${getAvatarColor(userRol)}`}>
            <AvatarFallback className={`${getAvatarColor(userRol)} text-white`}>
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{userName}</p>
            <Badge variant="outline" className={`text-xs ${getRolColor(userRol)}`}>
              {getRolLabel(userRol)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Menú */}
      <nav className="flex-1 p-4">
        {renderMenuItems()}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}
    </>
  )
}
