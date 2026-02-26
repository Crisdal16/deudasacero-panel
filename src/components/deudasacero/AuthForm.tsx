'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, LogIn, UserPlus, Mail, Lock, User, Phone, CreditCard } from 'lucide-react'

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (data: { nombre: string; email: string; password: string; telefono?: string; nif?: string }) => Promise<void>
  loading: boolean
  error: string | null
}

export function AuthForm({ onLogin, onRegister, loading, error }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState('login')
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    nif: '',
  })
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    if (!loginData.email || !loginData.password) {
      setValidationError('Por favor completa todos los campos')
      return
    }
    await onLogin(loginData.email, loginData.password)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    
    if (!registerData.nombre || !registerData.email || !registerData.password) {
      setValidationError('Nombre, email y contraseña son obligatorios')
      return
    }
    
    if (registerData.password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setValidationError('Las contraseñas no coinciden')
      return
    }
    
    await onRegister({
      nombre: registerData.nombre,
      email: registerData.email,
      password: registerData.password,
      telefono: registerData.telefono || undefined,
      nif: registerData.nif || undefined,
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-900 to-green-600 mb-4">
          <span className="text-4xl font-bold text-white">D</span>
        </div>
        <h1 className="text-3xl font-bold text-blue-900">Deudas a Cero</h1>
        <p className="text-gray-600 mt-2">Tu camino hacia la libertad financiera</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-blue-50">
          <TabsTrigger value="login" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
            Iniciar Sesión
          </TabsTrigger>
          <TabsTrigger value="register" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
            Registrarse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Acceso al Área Cliente</CardTitle>
              <CardDescription>
                Introduce tus credenciales para acceder a tu expediente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                {(error || validationError) && (
                  <Alert variant="destructive">
                    <AlertDescription>{error || validationError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Crear Cuenta</CardTitle>
              <CardDescription>
                Regístrate para iniciar tu proceso LSO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-nombre">Nombre completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="reg-nombre"
                      type="text"
                      placeholder="Tu nombre completo"
                      className="pl-10"
                      value={registerData.nombre}
                      onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-telefono">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="reg-telefono"
                        type="tel"
                        placeholder="+34 666 123 456"
                        className="pl-10"
                        value={registerData.telefono}
                        onChange={(e) => setRegisterData({ ...registerData, telefono: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-nif">NIF/DNI</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="reg-nif"
                        type="text"
                        placeholder="12345678A"
                        className="pl-10"
                        value={registerData.nif}
                        onChange={(e) => setRegisterData({ ...registerData, nif: e.target.value.toUpperCase() })}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Confirmar contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="Repite la contraseña"
                      className="pl-10"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                {(error || validationError) && (
                  <Alert variant="destructive">
                    <AlertDescription>{error || validationError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Crear Cuenta
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-gray-500 mt-6">
        ¿Problemas para acceder? Contacta con nosotros en{' '}
        <a href="mailto:info@deudasacero.es" className="text-blue-900 hover:underline">
          info@deudasacero.es
        </a>
      </p>
    </div>
  )
}
