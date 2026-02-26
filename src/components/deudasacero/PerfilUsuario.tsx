'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Save, 
  AlertCircle,
  Building,
  CreditCard,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PerfilUsuarioProps {
  user: {
    id: string
    nombre: string
    email: string
    telefono?: string | null
    nif?: string | null
    rol: 'admin' | 'abogado' | 'cliente'
    direccion?: string | null
    codigoPostal?: string | null
    ciudad?: string | null
    numeroColegiado?: string | null
  }
  onUpdate: (data?: unknown) => void
}

export function PerfilUsuario({ user, onUpdate }: PerfilUsuarioProps) {
  const [loading, setLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const { toast } = useToast()

  // Campos editables
  const [formData, setFormData] = useState({
    email: user.email || '',
    telefono: user.telefono || '',
    direccion: user.direccion || '',
    codigoPostal: user.codigoPostal || '',
    ciudad: user.ciudad || '',
    // Datos de facturación
    facturacionNombre: '',
    facturacionNif: '',
    facturacionDireccion: '',
    facturacionCodigoPostal: '',
    facturacionCiudad: '',
    // Abogado
    numeroColegiado: user.numeroColegiado || '',
  })

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      
      toast({
        title: 'Perfil actualizado',
        description: 'Los cambios se han guardado correctamente',
      })
      onUpdate()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      })
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      })
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/usuarios/perfil/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña')
      
      toast({
        title: 'Contraseña actualizada',
        description: 'La contraseña se ha cambiado correctamente',
      })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo cambiar la contraseña',
        variant: 'destructive',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal y de facturación</p>
      </div>

      {/* Datos no editables */}
      <Card className="border-blue-100 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <User className="w-5 h-5" />
            Datos Personales
          </CardTitle>
          <CardDescription>
            Estos datos no pueden ser modificados directamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-gray-500 text-sm">Nombre completo</Label>
              <p className="font-medium text-gray-900">{user.nombre}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-500 text-sm">DNI/NIF</Label>
              <p className="font-medium text-gray-900">{user.nif || 'No especificado'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-500 text-sm">Rol</Label>
              <Badge className={
                user.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                user.rol === 'abogado' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }>
                {user.rol === 'admin' ? 'Administrador' : 
                 user.rol === 'abogado' ? 'Abogado' : 'Cliente'}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>¿Necesitas modificar tu nombre o DNI?</strong>
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Para modificar estos datos, envía un email a{' '}
                  <a href="mailto:infodeudasacero@gmail.com" className="underline font-medium">
                    infodeudasacero@gmail.com
                  </a>
                  {' '}con la documentación correspondiente.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos de contacto editables */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <Phone className="w-5 h-5" />
            Datos de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="telefono"
                  type="tel"
                  className="pl-10"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+34 666 123 456"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle, número, piso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigoPostal">Código Postal</Label>
              <Input
                id="codigoPostal"
                value={formData.codigoPostal}
                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                placeholder="28001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input
              id="ciudad"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              placeholder="Madrid"
            />
          </div>
        </CardContent>
      </Card>

      {/* Número de colegiado (solo abogados) */}
      {user.rol === 'abogado' && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <Building className="w-5 h-5" />
              Datos Profesionales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numeroColegiado">Número de Colegiado</Label>
              <Input
                id="numeroColegiado"
                value={formData.numeroColegiado}
                onChange={(e) => setFormData({ ...formData, numeroColegiado: e.target.value })}
                placeholder="Ej: 12345 (Colegio de Madrid)"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Datos de facturación */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <CreditCard className="w-5 h-5" />
            Datos de Facturación
          </CardTitle>
          <CardDescription>
            Estos datos se usarán para emitir las facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="factNombre">Nombre/Razón Social</Label>
              <Input
                id="factNombre"
                value={formData.facturacionNombre}
                onChange={(e) => setFormData({ ...formData, facturacionNombre: e.target.value })}
                placeholder="Nombre para la factura"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="factNif">NIF/CIF</Label>
              <Input
                id="factNif"
                value={formData.facturacionNif}
                onChange={(e) => setFormData({ ...formData, facturacionNif: e.target.value })}
                placeholder="12345678A"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="factDireccion">Dirección</Label>
              <Input
                id="factDireccion"
                value={formData.facturacionDireccion}
                onChange={(e) => setFormData({ ...formData, facturacionDireccion: e.target.value })}
                placeholder="Dirección de facturación"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="factCP">Código Postal</Label>
              <Input
                id="factCP"
                value={formData.facturacionCodigoPostal}
                onChange={(e) => setFormData({ ...formData, facturacionCodigoPostal: e.target.value })}
                placeholder="28001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="factCiudad">Ciudad</Label>
            <Input
              id="factCiudad"
              value={formData.facturacionCiudad}
              onChange={(e) => setFormData({ ...formData, facturacionCiudad: e.target.value })}
              placeholder="Madrid"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cambio de contraseña */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <FileText className="w-5 h-5" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPass">Contraseña actual</Label>
              <Input
                id="currentPass"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPass">Nueva contraseña</Label>
              <Input
                id="newPass"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPass">Confirmar contraseña</Label>
              <Input
                id="confirmPass"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          
          {passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword && (
            <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
          )}
          
          <Button 
            onClick={handleChangePassword} 
            variant="outline"
            disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword}
          >
            {changingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cambiando...
              </>
            ) : (
              'Cambiar Contraseña'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          className="bg-blue-900 hover:bg-blue-800"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
