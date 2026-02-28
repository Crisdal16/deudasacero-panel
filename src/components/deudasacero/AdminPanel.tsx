'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Clock,
  CheckCircle2,
  Edit,
  Eye,
  Euro
} from 'lucide-react'

interface Expediente {
  id: string
  referencia: string
  faseActual: number
  porcentajeAvance: number
  usuario: {
    nombre: string
    email: string
    telefono: string | null
    nif: string | null
  }
  deudaTotal: number
  documentosPendientes: number
  mensajesNuevos: number
}

interface AdminPanelProps {
  expedientes: Expediente[]
  onUpdateExpediente: (id: string, data: { faseActual?: number; porcentajeAvance?: number }) => Promise<void>
}

const fases = [
  { num: 1, nombre: 'Solicitud Inicial' },
  { num: 2, nombre: 'Mediador Concursal' },
  { num: 3, nombre: 'Plan de Pagos' },
  { num: 4, nombre: 'Acuerdo Extrajudicial' },
  { num: 5, nombre: 'Fase Judicial' },
  { num: 6, nombre: 'Exoneración' },
]

export function AdminPanel({ expedientes, onUpdateExpediente }: AdminPanelProps) {
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null)
  const [editData, setEditData] = useState({ faseActual: 1, porcentajeAvance: 0 })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const stats = {
    totalExpedientes: expedientes.length,
    pendientesDocumentos: expedientes.filter(e => e.documentosPendientes > 0).length,
    mensajesNuevos: expedientes.reduce((sum, e) => sum + e.mensajesNuevos, 0),
    deudaTotal: expedientes.reduce((sum, e) => sum + e.deudaTotal, 0),
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)

  const handleOpenEdit = (exp: Expediente) => {
    setSelectedExpediente(exp)
    setEditData({ 
      faseActual: exp.faseActual, 
      porcentajeAvance: exp.porcentajeAvance 
    })
  }

  const handleSave = async () => {
    if (!selectedExpediente) return
    
    setSaving(true)
    try {
      await onUpdateExpediente(selectedExpediente.id, editData)
      toast({
        title: 'Expediente actualizado',
        description: 'Los cambios se han guardado correctamente',
      })
      setSelectedExpediente(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el expediente',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Panel de Administración</h1>
        <p className="text-gray-600">Gestión de expedientes y clientes</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Expedientes
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
              Pendientes Documentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{stats.pendientesDocumentos}</p>
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
          <CardTitle className="text-blue-900">Expedientes Activos</CardTitle>
          <CardDescription>
            Haz clic en un expediente para editar su estado
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      <p className="font-medium">{exp.usuario.nombre}</p>
                      <p className="text-sm text-gray-500">{exp.usuario.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      Fase {exp.faseActual}: {fases[exp.faseActual - 1]?.nombre}
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
                      onClick={() => handleOpenEdit(exp)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <Dialog open={!!selectedExpediente} onOpenChange={() => setSelectedExpediente(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Expediente</DialogTitle>
            <DialogDescription>
              {selectedExpediente?.referencia} - {selectedExpediente?.usuario.nombre}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpediente && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Fase Actual</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={editData.faseActual}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    faseActual: parseInt(e.target.value),
                    porcentajeAvance: Math.max(editData.porcentajeAvance, (parseInt(e.target.value) - 1) * 16)
                  })}
                >
                  {fases.map(fase => (
                    <option key={fase.num} value={fase.num}>
                      Fase {fase.num}: {fase.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Porcentaje de Avance: {editData.porcentajeAvance}%</Label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={editData.porcentajeAvance}
                  onChange={(e) => setEditData({ ...editData, porcentajeAvance: parseInt(e.target.value) })}
                  className="h-2"
                />
                <Progress value={editData.porcentajeAvance} className="h-3" />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setSelectedExpediente(null)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-blue-900 hover:bg-blue-800"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
