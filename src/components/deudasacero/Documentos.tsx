'use client'

import { useState, useRef, useCallback } from 'react'
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
  HelpCircle,
  Trash2,
  Eye,
  FileIcon,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
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

interface Documento {
  id: string
  nombre: string
  tipo: string
  estado: string
  esRequerido: boolean
  fechaSubida: string
  contenido?: string | null
  nombreArchivo?: string | null
  fase?: number
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
  faseActual?: number
  userRol?: string
  expedienteId?: string
  onUpload: (data: { nombre: string; tipo: string; contenido?: string; nombreArchivo?: string }) => Promise<void>
  onRefresh?: () => void
}

// Documentos por fase
const documentosPorFase: Record<number, { nombre: string; descripcion: string }[]> = {
  3: [
  { nombre: 'DNI/NIE (anverso y reverso)', descripcion: 'Documento de identidad en vigor' },
  { nombre: 'Certificado de titularidad y saldo de todas las cuentas bancarias', descripcion: 'Certificados de todos los bancos donde tengas cuenta' },
  { nombre: 'Últimos 6 meses de movimientos de todas las cuentas bancarias', descripcion: 'Extractos bancarios de los últimos 6 meses' },
  { nombre: 'Últimas 3 declaraciones del IRPF', descripcion: 'Declaraciones de la renta de los últimos 3 años' },
  { nombre: 'Últimas 6 nóminas (si trabaja)', descripcion: 'Solo si estás trabajando actualmente' },
  { nombre: 'Listado de gastos recurrentes mensuales', descripcion: 'Detalle de gastos fijos mensuales' },
  { nombre: 'Últimos 3 recibos de cada gasto', descripcion: 'Facturas de luz, agua, internet, alquiler, etc.' },
  { nombre: 'Resumen de donde deriva la deuda', descripcion: 'Explicación de cómo se llegó a la situación actual' },
  { nombre: 'Certificado digital de persona física', descripcion: 'Certificado para obtener documentación oficial' },
    { nombre: 'Otra documentación que estime conveniente', descripcion: 'Cualquier otro documento relevante' },
  ],
  4: [
    { nombre: 'Demanda de concurso consecutivo', descripcion: 'Demanda presentada ante el juzgado' },
    { nombre: 'Documentos anexos a la demanda', descripcion: 'Documentación adjunta a la demanda' },
    { nombre: 'Justificante de presentación', descripcion: 'Resguardo de presentación en el juzgado' },
  ],
  5: [
    { nombre: 'Auto de declaración de concurso', descripcion: 'Auto judicial que declara el concurso' },
    { nombre: 'Providencia del juzgado', descripcion: 'Comunicaciones del juzgado' },
    { nombre: 'Designación de administrador concursal', descripcion: 'Nombramiento del administrador' },
  ],
  6: [
    { nombre: 'Inventario de bienes', descripcion: 'Relación de bienes y derechos' },
    { nombre: 'Lista de acreedores', descripcion: 'Relación de deudas y acreedores' },
    { nombre: 'Informe de liquidación', descripcion: 'Estado de la fase de liquidación' },
  ],
  7: [
    { nombre: 'Informe de administración concursal', descripcion: 'Informe del administrador concursal' },
    { nombre: 'Propuesta de convenio', descripcion: 'Propuesta de pago a acreedores' },
    { nombre: 'Informe de operaciones', descripcion: 'Informe sobre las operaciones realizadas' },
  ],
  8: [
    { nombre: 'Acta de audiencia', descripcion: 'Acta de la junta de acreedores' },
    { nombre: 'Propuestas de pago aprobadas', descripcion: 'Acuerdos alcanzados con los acreedores' },
    { nombre: 'Votaciones de acreedores', descripcion: 'Resultado de las votaciones' },
  ],
  9: [
    { nombre: 'Auto de exoneración', descripcion: 'Auto judicial de exoneración de deudas' },
    { nombre: 'Plan de pagos', descripcion: 'Plan de pagos establecido' },
    { nombre: 'Resolución judicial definitiva', descripcion: 'Documento judicial definitivo' },
  ],
  10: [
    { nombre: 'Sentencia de cierre', descripcion: 'Sentencia que cierra el procedimiento' },
    { nombre: 'Certificado de finalización', descripcion: 'Certificado de fin de procedimiento' },
    { nombre: 'Documentación final completa', descripcion: 'Expediente completo del procedimiento' },
  ],
}

const nombresFases: Record<number, string> = {
  1: 'Inicio del expediente',
  2: 'Presupuesto y hoja de encargo',
  3: 'Recopilación de documentación',
  4: 'Presentación de concurso consecutivo',
  5: 'Auto de declaración de concurso',
  6: 'Fase de liquidación',
  7: 'Informe de administración concursal',
  8: 'Audiencia con los acreedores',
  9: 'Auto de exoneración',
  10: 'Resolución y fin del procedimiento',
}

export function Documentos({ 
  documentos, 
  checklist, 
  faseActual = 1, 
  userRol = 'cliente',
  expedienteId,
  onUpload,
  onRefresh
}: DocumentosProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({ nombre: '', tipo: 'otro' })
  const [viewingDoc, setViewingDoc] = useState<Documento | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const getFileIcon = (tipo: string) => {
    if (tipo.includes('image') || tipo.includes('jpg') || tipo.includes('png')) {
      return <ImageIcon className="w-8 h-8 text-green-500" />
    }
    if (tipo.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />
    }
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />
    }
    return <FileIcon className="w-8 h-8 text-gray-500" />
  }

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'El archivo es demasiado grande. Máximo 10MB.',
        variant: 'destructive',
      })
      return
    }

    setSelectedFile(file)
    
    // Auto-fill nombre
    if (!formData.nombre) {
      setFormData(prev => ({ ...prev, nombre: file.name.split('.')[0] }))
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:*/*;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
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

    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un archivo',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      const contenido = await convertToBase64(selectedFile)
      
      await onUpload({
        nombre: formData.nombre,
        tipo: formData.tipo,
        contenido,
        nombreArchivo: selectedFile.name,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Reset form
      setFormData({ nombre: '', tipo: 'otro' })
      setSelectedFile(null)
      setPreviewUrl(null)
      setShowUpload(false)
      
      toast({
        title: 'Documento subido',
        description: 'El documento se ha subido correctamente',
      })
      
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo subir el documento',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDownload = async (doc: Documento) => {
    if (!doc.contenido) {
      toast({
        title: 'Error',
        description: 'El documento no tiene contenido para descargar',
        variant: 'destructive',
      })
      return
    }

    try {
      // Determine MIME type
      const extension = doc.nombreArchivo?.split('.').pop()?.toLowerCase() || 'pdf'
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
      const mimeType = mimeTypes[extension] || 'application/octet-stream'
      
      // Create download link
      const link = document.createElement('a')
      link.href = `data:${mimeType};base64,${doc.contenido}`
      link.download = doc.nombreArchivo || doc.nombre
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el documento',
        variant: 'destructive',
      })
    }
  }

  const handleView = (doc: Documento) => {
    setViewingDoc(doc)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Documentos</h1>
          <p className="text-gray-600">
            {faseActual === 3 
              ? 'Documentación obligatoria para tu expediente LSO'
              : 'Sube y gestiona los documentos de tu expediente'
            }
          </p>
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

      {/* Lista de documentos obligatorios para Fase 3 */}
      {faseActual === 3 && documentosPorFase[3] && (
        <Card className="border-blue-100">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-900">📋 Documentación Obligatoria para LSO</CardTitle>
            <CardDescription>
              Esta documentación es necesaria para presentar la demanda de concurso consecutivo de persona física
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {documentosPorFase[3].map((doc, index) => {
                const uploadedDoc = documentos.find(d => d.nombre.toLowerCase().includes(doc.nombre.toLowerCase().split(' ')[0]))
                return (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      uploadedDoc 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {uploadedDoc ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{doc.nombre}</p>
                          <p className="text-sm text-gray-500">{doc.descripcion}</p>
                        </div>
                      </div>
                      {uploadedDoc && (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleView(uploadedDoc)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(uploadedDoc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Modal de subida con drag and drop */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subir nuevo documento</DialogTitle>
            <DialogDescription>
              Arrastra un archivo o haz clic para seleccionarlo
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : selectedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                            {/* Input file oculto - Fixed */}
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInput}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded" />
                  ) : (
                    getFileIcon(selectedFile.type)
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Arrastra un archivo aquí
                    </p>
                    <p className="text-sm text-gray-500">o</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    PDF, JPG, PNG, DOC, XLS (máx. 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-center text-gray-500">Subiendo... {uploadProgress}%</p>
              </div>
            )}

            {/* Form fields */}
            <div className="space-y-2">
              <Label htmlFor="doc-nombre">Nombre del documento *</Label>
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
                <option value="DNI">DNI/NIE</option>
                <option value="IRPF">IRPF</option>
                <option value="nomina">Nómina</option>
                <option value="certificado">Certificado</option>
                <option value="extracto">Extracto bancario</option>
                <option value="factura">Factura/Recibo</option>
                <option value="auto">Auto judicial</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowUpload(false)
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }} 
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700" 
                disabled={uploading || !selectedFile}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Documento
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver documento */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.nombre}</DialogTitle>
            <DialogDescription>
              {viewingDoc?.nombreArchivo} • Subido el {viewingDoc?.fechaSubida && formatDate(viewingDoc.fechaSubida)}
            </DialogDescription>
          </DialogHeader>
          
          {viewingDoc?.contenido && (
            <div className="mt-4">
              {viewingDoc.nombreArchivo?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`data:application/pdf;base64,${viewingDoc.contenido}`}
                  className="w-full h-96 rounded border"
                  title="Document preview"
                />
              ) : viewingDoc.nombreArchivo?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={`data:image/jpeg;base64,${viewingDoc.contenido}`}
                  alt={viewingDoc.nombre}
                  className="max-w-full mx-auto rounded"
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileIcon className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p>Vista previa no disponible para este tipo de archivo</p>
                  <Button 
                    className="mt-4"
                    onClick={() => viewingDoc && handleDownload(viewingDoc)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar archivo
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checklist de documentos */}
      {checklist.length > 0 && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="text-blue-900">Documentos Requeridos</CardTitle>
            <CardDescription>
              Lista de documentos necesarios para tu expediente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.map((item) => {
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc && getEstadoBadge(doc.estado)}
                      {doc && (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleView(doc)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentos de fases posteriores (4-10) */}
      {faseActual >= 4 && (
        <Card className="border-blue-100">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-900">📄 Documentos del Procedimiento</CardTitle>
            <CardDescription>
              Documentos judiciales y administrativos de cada fase del proceso
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {[4, 5, 6, 7, 8, 9, 10].map((fase) => {
                const docsFase = documentos.filter(d => d.fase === fase || (fase === faseActual && d.fase === undefined))
                const documentosEsperados = documentosPorFase[fase] || []
                const isFaseActual = fase === faseActual
                
                // Solo mostrar fases que tienen documentos o son la fase actual
                if (docsFase.length === 0 && !isFaseActual) return null
                
                return (
                  <div key={fase} className={`p-4 rounded-lg border ${isFaseActual ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={isFaseActual ? 'bg-blue-600' : 'bg-gray-500'}>
                        Fase {fase}
                      </Badge>
                      <h4 className="font-medium text-gray-900">
                        {nombresFases[fase]}
                      </h4>
                    </div>
                    
                    {docsFase.length > 0 ? (
                      <div className="space-y-2">
                        {docsFase.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-red-500" />
                              <div>
                                <p className="text-sm font-medium">{doc.nombre}</p>
                                <p className="text-xs text-gray-500">
                                  {doc.nombreArchivo} • {formatDate(doc.fechaSubida)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleView(doc)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownload(doc)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Aún no hay documentos subidos para esta fase
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Circle icon component
function Circle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}
