'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Upload, 
  Download, 
  CheckCircle2, 
  Clock,
  Plus,
  X,
  Eye,
  FileIcon,
  Loader2,
  AlertCircle,
  PenTool,
  Signature,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Presupuesto {
  id: string
  nombre: string
  nombreArchivo?: string | null
  contenido?: string | null
  fechaSubida: string
  estado: string
}

interface Firma {
  id: string
  tipo: string
  documento: string
  datosFirma?: string | null
  fechaFirma: string
  verificado: boolean
  usuario?: {
    nombre: string
    email: string
  }
}

interface PresupuestoSectionProps {
  expedienteId?: string
  userRol: string
  faseActual: number
  presupuesto?: Presupuesto | null
  onUpload: (data: { nombre: string; contenido: string; nombreArchivo: string }) => Promise<void>
  onRefresh?: () => void
}

export function PresupuestoSection({ 
  expedienteId, 
  userRol, 
  faseActual,
  presupuesto,
  onUpload,
  onRefresh
}: PresupuestoSectionProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [viewingDoc, setViewingDoc] = useState<Presupuesto | null>(null)
  const [formData, setFormData] = useState({ nombre: 'Hoja de Encargo y Presupuesto' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Estados para firma
  const [showFirmaDialog, setShowFirmaDialog] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [firmas, setFirmas] = useState<Firma[]>([])
  const [loadingFirmas, setLoadingFirmas] = useState(false)
  const [showUploadFirmado, setShowUploadFirmado] = useState(false)
  const [selectedFileFirmado, setSelectedFileFirmado] = useState<File | null>(null)
  const [uploadingFirmado, setUploadingFirmado] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputFirmadoRef = useRef<HTMLInputElement>(null)

  // Solo admin puede subir, cliente puede firmar
  const canUpload = userRol === 'admin'
  const canSign = userRol === 'cliente'
  const isActive = faseActual === 2

  // Cargar firmas existentes
  useEffect(() => {
    if (expedienteId) {
      fetchFirmas()
    }
  }, [expedienteId])

  const fetchFirmas = async () => {
    if (!expedienteId) return
    setLoadingFirmas(true)
    try {
      const res = await fetch(`/api/firmas?expedienteId=${expedienteId}`)
      const data = await res.json()
      setFirmas(data.firmas || [])
    } catch (error) {
      console.error('Error cargando firmas:', error)
    } finally {
      setLoadingFirmas(false)
    }
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
    // Solo aceptar PDF
    if (!file.type.includes('pdf')) {
      toast({
        title: 'Error',
        description: 'Solo se aceptan archivos PDF para el presupuesto.',
        variant: 'destructive',
      })
      return
    }

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
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un archivo PDF',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    
    try {
      const contenido = await convertToBase64(selectedFile)
      
      await onUpload({
        nombre: formData.nombre,
        contenido,
        nombreArchivo: selectedFile.name,
      })

      // Reset form
      setSelectedFile(null)
      setShowUpload(false)
      
      toast({
        title: 'Presupuesto subido',
        description: 'El presupuesto se ha subido correctamente',
      })
      
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo subir el presupuesto',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (doc: Presupuesto) => {
    if (!doc.contenido) return
    
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${doc.contenido}`
    link.download = doc.nombreArchivo || doc.nombre
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Firma manuscrita
  const initCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    let x, y
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }
    
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const rect = canvas.getBoundingClientRect()
    let x, y
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
      e.preventDefault()
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }
    
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    initCanvas()
    setSignatureData(null)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const dataUrl = canvas.toDataURL('image/png')
    setSignatureData(dataUrl)
    toast({
      title: 'Firma guardada',
      description: 'Tu firma ha sido capturada. Ahora puedes confirmarla.',
    })
  }

  const submitSignature = async () => {
    if (!signatureData || !expedienteId) return
    
    setUploading(true)
    try {
      const res = await fetch('/api/firmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expedienteId,
          documento: presupuesto?.nombre || 'Hoja de Encargo y Presupuesto',
          firmaData: signatureData,
          tipo: 'manuscrita',
        }),
      })
      
      if (!res.ok) throw new Error('Error al guardar firma')
      
      toast({
        title: 'Firma registrada',
        description: 'Tu firma se ha registrado correctamente',
      })
      
      setShowFirmaDialog(false)
      setSignatureData(null)
      fetchFirmas()
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar la firma',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  // Subir documento firmado
  const handleFileFirmadoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!file.type.includes('pdf')) {
        toast({
          title: 'Error',
          description: 'Solo se aceptan archivos PDF.',
          variant: 'destructive',
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'El archivo es demasiado grande. Máximo 10MB.',
          variant: 'destructive',
        })
        return
      }
      setSelectedFileFirmado(file)
    }
  }

  const handleUploadFirmado = async () => {
    if (!selectedFileFirmado || !expedienteId) return
    
    setUploadingFirmado(true)
    try {
      const contenido = await convertToBase64(selectedFileFirmado)
      
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: `Hoja de Encargo Firmada - ${selectedFileFirmado.name}`,
          tipo: 'encargo_firmado',
          contenido,
          nombreArchivo: selectedFileFirmado.name,
          expedienteId,
        }),
      })
      
      if (!res.ok) throw new Error('Error al subir documento')
      
      toast({
        title: 'Documento subido',
        description: 'El documento firmado se ha subido correctamente',
      })
      
      setShowUploadFirmado(false)
      setSelectedFileFirmado(null)
      onRefresh?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo subir el documento firmado',
        variant: 'destructive',
      })
    } finally {
      setUploadingFirmado(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasFirmado = firmas.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Presupuesto y Hoja de Encargo</h1>
          <p className="text-gray-600">
            {isActive 
              ? 'Revisa y firma el presupuesto para continuar con tu expediente'
              : 'Documentación de presupuesto y hoja de encargo'
            }
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setShowUpload(true)} className="bg-blue-900 hover:bg-blue-800">
            <Plus className="w-4 h-4 mr-2" />
            Subir Presupuesto
          </Button>
        )}
      </div>

      {/* Estado de la fase */}
      <Card className={`border-2 ${isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {presupuesto ? (
              hasFirmado ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Presupuesto firmado</p>
                    <p className="text-sm text-green-700">
                      Firmado el {firmas[0]?.fechaFirma && formatDate(firmas[0].fechaFirma)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Presupuesto pendiente de firma</p>
                    <p className="text-sm text-blue-700">
                      {canSign 
                        ? 'Descarga, firma y sube el documento firmado, o firma digitalmente'
                        : 'Esperando firma del cliente'
                      }
                    </p>
                  </div>
                </>
              )
            ) : isActive ? (
              <>
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Pendiente de presupuesto</p>
                  <p className="text-sm text-orange-700">
                    {canUpload 
                      ? 'Sube la hoja de encargo y presupuesto en PDF'
                      : 'El despacho te enviará el presupuesto próximamente'
                    }
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-600">Fase no activa</p>
                  <p className="text-sm text-gray-500">
                    El presupuesto estará disponible en la Fase 2
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Presupuesto subido */}
      {presupuesto && (
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileText className="w-5 h-5" />
              Documento de Presupuesto
            </CardTitle>
            <CardDescription>
              {presupuesto.nombreArchivo}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileIcon className="w-8 h-8 text-red-500" />
                <div>
                  <p className="font-medium">{presupuesto.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {presupuesto.nombreArchivo} • {formatDate(presupuesto.fechaSubida)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setViewingDoc(presupuesto)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownload(presupuesto)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar
                </Button>
              </div>
            </div>

            {/* Acciones para cliente */}
            {canSign && !hasFirmado && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="text-center space-y-3">
                      <PenTool className="w-10 h-10 mx-auto text-green-600" />
                      <h3 className="font-medium text-green-800">Firma Digital</h3>
                      <p className="text-sm text-green-700">
                        Firma electrónicamente con tu ratón o dedo
                      </p>
                      <Button 
                        onClick={() => {
                          setShowFirmaDialog(true)
                          setTimeout(initCanvas, 100)
                        }}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <Signature className="w-4 h-4 mr-2" />
                        Firmar Digitalmente
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="text-center space-y-3">
                      <Upload className="w-10 h-10 mx-auto text-blue-600" />
                      <h3 className="font-medium text-blue-800">Subir Firmado</h3>
                      <p className="text-sm text-blue-700">
                        Descarga, firma a mano y sube el PDF
                      </p>
                      <Button 
                        onClick={() => setShowUploadFirmado(true)}
                        variant="outline"
                        className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Documento Firmado
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Estado de firma */}
            {hasFirmado && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Documento firmado</p>
                    <p className="text-sm text-green-700">
                      Por {firmas[0]?.usuario?.nombre} el {formatDate(firmas[0]?.fechaFirma)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instrucciones para cliente */}
      {canSign && presupuesto && !hasFirmado && (
        <Card className="border-yellow-100 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Instrucciones para firmar</p>
                <ol className="text-sm text-yellow-700 mt-2 list-decimal list-inside space-y-1">
                  <li>Descarga el documento PDF</li>
                  <li>Revisa el presupuesto y la hoja de encargo</li>
                  <li>Firma digitalmente o imprime, firma a mano y escanea</li>
                  <li>Sube el documento firmado o confirma tu firma digital</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ayuda para clientes sin presupuesto */}
      {canSign && !presupuesto && isActive && (
        <Card className="border-yellow-100 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">¿Tienes dudas sobre el presupuesto?</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Contacta con tu abogado a través de la sección de <strong>Mensajes</strong> o envía un email a{' '}
                  <a href="mailto:infodeudasacero@gmail.com" className="underline">infodeudasacero@gmail.com</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de subida (Admin) */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subir Presupuesto y Hoja de Encargo</DialogTitle>
            <DialogDescription>
              Sube el documento PDF con el presupuesto y la hoja de encargo
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
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInput}
                accept=".pdf"
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-red-500" />
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
                    onClick={() => setSelectedFile(null)}
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
                      Arrastra un archivo PDF aquí
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
                    Solo archivos PDF (máx. 10MB)
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-nombre">Nombre del documento</Label>
              <Input
                id="doc-nombre"
                placeholder="Ej: Hoja de Encargo y Presupuesto"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                disabled={uploading}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowUpload(false)
                  setSelectedFile(null)
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
                    Subir Presupuesto
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de firma digital */}
      <Dialog open={showFirmaDialog} onOpenChange={setShowFirmaDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Firma Digital</DialogTitle>
            <DialogDescription>
              Dibuja tu firma en el área de abajo usando el ratón o tu dedo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="w-full border border-gray-200 rounded cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            
            <div className="flex gap-2 justify-between">
              <Button 
                variant="outline" 
                onClick={clearSignature}
                type="button"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Borrar
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowFirmaDialog(false)}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={submitSignature}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!signatureData || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirmar Firma
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal subir documento firmado */}
      <Dialog open={showUploadFirmado} onOpenChange={setShowUploadFirmado}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Subir Documento Firmado</DialogTitle>
            <DialogDescription>
              Sube el presupuesto firmado en formato PDF
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedFileFirmado
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputFirmadoRef}
                type="file"
                className="hidden"
                onChange={handleFileFirmadoInput}
                accept=".pdf"
              />
              
              {selectedFileFirmado ? (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFileFirmado.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFileFirmado.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFileFirmado(null)}
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
                      Arrastra o selecciona el PDF firmado
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => fileInputFirmadoRef.current?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadFirmado(false)
                  setSelectedFileFirmado(null)
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUploadFirmado}
                className="bg-green-600 hover:bg-green-700"
                disabled={!selectedFileFirmado || uploadingFirmado}
              >
                {uploadingFirmado ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para ver documento */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.nombre}</DialogTitle>
            <DialogDescription>
              {viewingDoc?.nombreArchivo}
            </DialogDescription>
          </DialogHeader>
          
          {viewingDoc?.contenido && (
            <div className="mt-4">
              <iframe
                src={`data:application/pdf;base64,${viewingDoc.contenido}`}
                className="w-full h-[60vh] rounded border"
                title="Presupuesto preview"
              />
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setViewingDoc(null)}>
              Cerrar
            </Button>
            {viewingDoc && (
              <Button onClick={() => handleDownload(viewingDoc)}>
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
