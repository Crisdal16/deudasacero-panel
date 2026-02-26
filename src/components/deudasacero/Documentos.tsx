'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Upload, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  X,
  HelpCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Documento {
  id: string
  nombre: string
  tipo: string
  estado: string
  esRequerido: boolean
  fechaSubida: string
}

interface ChecklistItem {
  id: string
  nombre: string
  obligatorio: boolean
  noAplica: boolean
  orden: number
  documentoId: string | null
}

interface DocumentosProps {
  documentos: Documento[]
  checklist: ChecklistItem[]
  onUpload: (data: { nombre: string; tipo: string; contenido?: string }) => Promise<void>
}

const tiposDocumento = [
  { value: 'DNI', label: 'DNI/NIE' },
  { value: 'IRPF', label: 'IRPF' },
  { value: 'nomina', label: 'Nómina' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'auto', label: 'Auto judicial' },
  { value: 'otro', label: 'Otro' },
]

export function Documentos({ documentos, checklist, onUpload }: DocumentosProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', tipo: 'DNI' })
  const { toast } = useToast()

  // Calcular progreso
  const totalRequeridos = checklist.filter(c => c.obligatorio).length
  const completados = checklist.filter(c => c.documentoId || c.noAplica).length
  const progreso = totalRequeridos > 0 ? Math.round((completados / totalRequeridos) * 100) : 0

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'revisado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Revisado ✓</Badge>
      case 'subido':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">Subido</Badge>
      case 'incorrecto':
        return <Badge variant="destructive">Incorrecto</Badge>
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Pendiente</Badge>
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del documento es obligatorio',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      await onUpload(formData)
      setFormData({ nombre: '', tipo: 'DNI' })
      setShowUpload(false)
      toast({
        title: 'Documento subido',
        description: 'El documento se ha subido correctamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo subir el documento',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Documentos</h1>
          <p className="text-gray-600">Sube y gestiona los documentos de tu expediente</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-blue-900 hover:bg-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Subir Documento
        </Button>
      </div>

      {/* Progreso */}
      <Card className="border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-900" />
            Progreso de Documentación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={progreso} className="flex-1 h-3" />
            <span className="text-sm font-medium text-blue-900">
              {completados} de {totalRequeridos} documentos
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Ayuda */}
      <Card className="border-green-100 bg-green-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">¿Necesitas ayuda?</p>
              <p className="text-sm text-green-700">
                Envía tus documentos por <strong>WhatsApp</strong> al{' '}
                <a href="https://wa.me/34644266713" className="underline">+34 644 266 713</a> 
                {' '}o por <strong>email</strong> a{' '}
                <a href="mailto:info@deudasacero.gmail.com" className="underline">info@deudasacero.gmail.com</a>
                {' '}y los subiremos por ti.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de subida */}
      {showUpload && (
        <Card className="border-blue-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-900">Subir nuevo documento</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowUpload(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc-nombre">Nombre del documento</Label>
                <Input
                  id="doc-nombre"
                  placeholder="Ej: DNI frontal"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  disabled={uploading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-tipo">Tipo de documento</Label>
                <select
                  id="doc-tipo"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  disabled={uploading}
                >
                  {tiposDocumento.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowUpload(false)} disabled={uploading}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={uploading}>
                  {uploading ? 'Subiendo...' : 'Subir Documento'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Checklist de documentos requeridos */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-blue-900">Documentos Requeridos</CardTitle>
          <CardDescription>
            Lista de documentos necesarios para tu expediente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checklist.map((item, index) => {
              const doc = documentos.find(d => d.id === item.documentoId)
              return (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    item.noAplica 
                      ? 'bg-gray-50 border-gray-200' 
                      : doc 
                        ? doc.estado === 'revisado' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-blue-50 border-blue-200'
                        : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${
                      item.noAplica 
                        ? 'bg-gray-200' 
                        : doc 
                          ? doc.estado === 'revisado' 
                            ? 'bg-green-200' 
                            : 'bg-blue-200'
                          : 'bg-yellow-200'
                    }`}>
                      {item.noAplica ? (
                        <X className="w-4 h-4 text-gray-500" />
                      ) : doc ? (
                        doc.estado === 'revisado' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-600" />
                        )
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.nombre}</p>
                      {doc && (
                        <p className="text-xs text-gray-500">
                          Subido el {formatDate(doc.fechaSubida)}
                        </p>
                      )}
                      {item.noAplica && (
                        <p className="text-xs text-gray-500">No aplica</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc && getEstadoBadge(doc.estado)}
                    {doc && (
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documentos subidos adicionales */}
      {documentos.filter(d => !checklist.some(c => c.documentoId === d.id)).length > 0 && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-900">Otros Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documentos
                .filter(d => !checklist.some(c => c.documentoId === d.id))
                .map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {doc.tipo} • {formatDate(doc.fechaSubida)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getEstadoBadge(doc.estado)}
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
