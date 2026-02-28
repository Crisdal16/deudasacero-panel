'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Download, 
  FileText,
  Calendar,
  Euro,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Pago {
  id: string
  concepto: string
  importe: number
  fechaPago: string | null
  fechaVencimiento: string | null
  estado: string
  metodoPago: string | null
  referencia: string | null
  notas: string | null
}

interface Factura {
  id: string
  numero: string
  fecha: string
  importe: number
  estado: string
  concepto?: string
  contenido?: string
  nombreArchivo?: string
}

interface PagosFacturasProps {
  userRol: 'cliente' | 'admin' | 'abogado'
}

export function PagosFacturas({ userRol }: PagosFacturasProps) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pagosRes, facturasRes] = await Promise.all([
        fetch('/api/pagos'),
        fetch('/api/facturas'),
      ])
      
      const pagosData = await pagosRes.json()
      const facturasData = await facturasRes.json()
      
      setPagos(pagosData.pagos || [])
      setFacturas(facturasData.facturas || [])
    } catch (error) {
      console.error('Error fetching pagos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
      case 'pagada':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Pagado
          </Badge>
        )
      case 'vencido':
      case 'vencida':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Vencido
          </Badge>
        )
      case 'anulada':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
            Anulada
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        )
    }
  }

  const handleDownloadFactura = async (facturaId: string, nombreArchivo: string) => {
    try {
      const res = await fetch(`/api/facturas/${facturaId}/download`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      // Crear enlace de descarga
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${data.contenido}`
      link.download = nombreArchivo || `factura-${facturaId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: 'Descargando factura',
        description: 'La factura se está descargando',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar la factura',
        variant: 'destructive',
      })
    }
  }

  // Calcular totales
  const totalPagado = pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + p.importe, 0)
  const totalPendiente = pagos.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + p.importe, 0)
  
  // Filtrar facturas anuladas para el cliente
  const facturasVisibles = facturas.filter(f => f.estado !== 'anulada')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Mis Pagos y Facturas</h1>
        <p className="text-gray-600">Historial de pagos y documentos de facturación</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Total Pagado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPagado)}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-100 bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendiente de Pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{formatCurrency(totalPendiente)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Pagos */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Historial de Pagos
          </CardTitle>
          <CardDescription>
            Todos los pagos realizados y pendientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pagos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pagos.map((pago) => (
                <div 
                  key={pago.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    pago.estado === 'pagado' 
                      ? 'bg-green-50 border-green-200' 
                      : pago.estado === 'vencido'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      pago.estado === 'pagado' 
                        ? 'bg-green-100' 
                        : pago.estado === 'vencido'
                          ? 'bg-red-100'
                          : 'bg-yellow-100'
                    }`}>
                      <Euro className={`w-5 h-5 ${
                        pago.estado === 'pagado' 
                          ? 'text-green-600' 
                          : pago.estado === 'vencido'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pago.concepto}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {pago.fechaPago && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Pagado: {formatDate(pago.fechaPago)}
                          </span>
                        )}
                        {pago.fechaVencimiento && !pago.fechaPago && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Vence: {formatDate(pago.fechaVencimiento)}
                          </span>
                        )}
                        {pago.metodoPago && (
                          <span>Método: {pago.metodoPago}</span>
                        )}
                      </div>
                      {pago.notas && (
                        <p className="text-xs text-gray-400 mt-1">{pago.notas}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(pago.importe)}</p>
                    {getEstadoBadge(pago.estado)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facturas */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Facturas
          </CardTitle>
          <CardDescription>
            Documentos de facturación emitidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {facturasVisibles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay facturas disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {facturasVisibles.map((factura) => (
                <div 
                  key={factura.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    factura.estado === 'pagada' 
                      ? 'bg-green-50 border-green-200' 
                      : factura.estado === 'anulada'
                        ? 'bg-gray-50 border-gray-200 opacity-50'
                        : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      factura.estado === 'pagada' 
                        ? 'bg-green-100' 
                        : factura.estado === 'anulada'
                          ? 'bg-gray-100'
                          : 'bg-yellow-100'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        factura.estado === 'pagada' 
                          ? 'text-green-600' 
                          : factura.estado === 'anulada'
                            ? 'text-gray-400'
                            : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Factura {factura.numero}
                      </p>
                      <p className="text-sm text-gray-500">
                        {factura.concepto || 'Servicios profesionales'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Fecha: {formatDate(factura.fecha)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(factura.importe)}
                      </p>
                      {getEstadoBadge(factura.estado)}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadFactura(factura.id, factura.nombreArchivo || `factura-${factura.numero}.pdf`)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de contacto */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="py-4">
          <p className="text-sm text-blue-800">
            <strong>¿Tienes dudas sobre tu facturación?</strong>
            {' '}Contacta con nosotros en{' '}
            <a href="mailto:infodeudasacero@gmail.com" className="underline font-medium">
              infodeudasacero@gmail.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
