'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Euro, 
  FileText, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  CreditCard,
  Send
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FacturacionData {
  id: string
  expedienteId: string
  importePresupuestado: number
  importeFacturado: number
  estado: string
  metodoPago: string | null
  createdAt: string
  expediente: {
    id: string
    referencia: string
    cliente: {
      id: string
      nombre: string
      email: string
    }
  }
  pagos: PagoData[]
}

interface PagoData {
  id: string
  concepto: string
  importe: number
  estado: string
  metodoPago: string | null
  fechaPago: string | null
  fechaVencimiento: string | null
  createdAt: string
}

interface FacturacionSectionProps {
  expedienteId?: string
  userRol: 'admin' | 'abogado' | 'cliente'
}

export function FacturacionSection({ expedienteId, userRol }: FacturacionSectionProps) {
  const [facturacion, setFacturacion] = useState<FacturacionData[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewFactura, setShowNewFactura] = useState(false)
  const [showNewPago, setShowNewPago] = useState(false)
  const [selectedFacturacion, setSelectedFacturacion] = useState<FacturacionData | null>(null)
  
  // Form states
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState('')
  const [nuevoPago, setNuevoPago] = useState({ concepto: '', importe: '', metodoPago: '' })
  
  const { toast } = useToast()
  
  const canEdit = userRol === 'admin' || userRol === 'abogado'

  useEffect(() => {
    fetchFacturacion()
  }, [expedienteId])

  const fetchFacturacion = async () => {
    setLoading(true)
    try {
      const url = expedienteId 
        ? `/api/facturacion?expedienteId=${expedienteId}`
        : '/api/facturacion'
      const res = await fetch(url)
      const data = await res.json()
      setFacturacion(data.facturacion || [])
    } catch (error) {
      console.error('Error fetching facturación:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCrearFacturacion = async () => {
    if (!expedienteId || !nuevoPresupuesto) return
    
    try {
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expedienteId,
          importePresupuestado: parseFloat(nuevoPresupuesto),
          estado: 'pendiente'
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear facturación')
      }
      
      toast({ title: 'Facturación creada', description: 'El registro de facturación ha sido creado correctamente' })
      setShowNewFactura(false)
      setNuevoPresupuesto('')
      fetchFacturacion()
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleRegistrarPago = async () => {
    if (!selectedFacturacion || !nuevoPago.concepto || !nuevoPago.importe) return
    
    try {
      const res = await fetch('/api/facturacion/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturacionId: selectedFacturacion.id,
          concepto: nuevoPago.concepto,
          importe: parseFloat(nuevoPago.importe),
          metodoPago: nuevoPago.metodoPago || undefined
        })
      })
      
      if (!res.ok) throw new Error('Error al registrar pago')
      
      toast({ title: 'Pago registrado', description: 'El pago ha sido registrado correctamente' })
      setShowNewPago(false)
      setNuevoPago({ concepto: '', importe: '', metodoPago: '' })
      setSelectedFacturacion(null)
      fetchFacturacion()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo registrar el pago',
        variant: 'destructive'
      })
    }
  }

  const handleMarcarPagado = async (pagoId: string) => {
    try {
      const res = await fetch(`/api/facturacion/pagos/${pagoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estado: 'pagado',
          fechaPago: new Date().toISOString()
        })
      })
      
      if (!res.ok) throw new Error('Error al actualizar pago')
      
      toast({ title: 'Pago actualizado', description: 'El pago ha sido marcado como completado' })
      fetchFacturacion()
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo actualizar el pago',
        variant: 'destructive'
      })
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Pagado</Badge>
      case 'parcial':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Parcial</Badge>
      case 'pendiente':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      case 'moroso':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Moroso</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Cargando facturación...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Euro className="h-6 w-6" />
            Facturación
          </h2>
          <p className="text-gray-600">Gestión de presupuestos y pagos</p>
        </div>
        
        {canEdit && expedienteId && (
          <Dialog open={showNewFactura} onOpenChange={setShowNewFactura}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Facturación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Registro de Facturación</DialogTitle>
                <DialogDescription>
                  Define el presupuesto para este expediente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="presupuesto">Importe Presupuestado (€)</Label>
                  <Input
                    id="presupuesto"
                    type="number"
                    value={nuevoPresupuesto}
                    onChange={(e) => setNuevoPresupuesto(e.target.value)}
                    placeholder="1500.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewFactura(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCrearFacturacion}>
                  Crear
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {facturacion.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay registros de facturación</p>
            {canEdit && expedienteId && (
              <Button variant="outline" className="mt-4" onClick={() => setShowNewFactura(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Facturación
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {facturacion.map((fact) => (
            <Card key={fact.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {fact.expediente?.referencia || 'Sin referencia'}
                    </CardTitle>
                    <CardDescription>
                      Cliente: {fact.expediente?.cliente?.nombre || 'N/A'}
                    </CardDescription>
                  </div>
                  {getEstadoBadge(fact.estado)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Presupuestado</p>
                    <p className="text-xl font-bold text-blue-900">
                      {fact.importePresupuestado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Facturado</p>
                    <p className="text-xl font-bold text-green-600">
                      {fact.importeFacturado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pendiente</p>
                    <p className="text-xl font-bold text-orange-600">
                      {(fact.importePresupuestado - fact.importeFacturado).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Método</p>
                    <p className="font-medium">{fact.metodoPago || 'Sin definir'}</p>
                  </div>
                </div>

                {/* Pagos */}
                {fact.pagos.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Pagos Registrados</h4>
                      {canEdit && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedFacturacion(fact)
                            setShowNewPago(true)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Añadir Pago
                        </Button>
                      )}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Importe</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          {canEdit && <TableHead>Acciones</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fact.pagos.map((pago) => (
                          <TableRow key={pago.id}>
                            <TableCell>{pago.concepto}</TableCell>
                            <TableCell>
                              {pago.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={pago.estado === 'pagado' ? 'default' : 'secondary'}>
                                {pago.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {pago.fechaPago 
                                ? new Date(pago.fechaPago).toLocaleDateString('es-ES')
                                : '-'
                              }
                            </TableCell>
                            {canEdit && (
                              <TableCell>
                                {pago.estado !== 'pagado' && (
                                  <Button 
                                    size="sm"
                                    onClick={() => handleMarcarPagado(pago.id)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Pagado
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {fact.pagos.length === 0 && canEdit && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSelectedFacturacion(fact)
                      setShowNewPago(true)
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registrar Primer Pago
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para nuevo pago */}
      <Dialog open={showNewPago} onOpenChange={setShowNewPago}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Añade un nuevo pago al registro de facturación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                value={nuevoPago.concepto}
                onChange={(e) => setNuevoPago({...nuevoPago, concepto: e.target.value})}
                placeholder="Pago inicial, cuota 1, etc."
              />
            </div>
            <div>
              <Label htmlFor="importe">Importe (€)</Label>
              <Input
                id="importe"
                type="number"
                value={nuevoPago.importe}
                onChange={(e) => setNuevoPago({...nuevoPago, importe: e.target.value})}
                placeholder="500.00"
              />
            </div>
            <div>
              <Label htmlFor="metodo">Método de Pago</Label>
              <Select 
                value={nuevoPago.metodoPago} 
                onValueChange={(v) => setNuevoPago({...nuevoPago, metodoPago: v})}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPago(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarPago}>
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
