'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  AlertCircle
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

  // Solo admin puede subir, todos pueden ver
  const canUpload = userRol === 'admin'
  const isActive = faseActual === 2

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

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
        {canUpload && isActive && (
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
              <>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Presupuesto disponible</p>
                  <p className="text-sm text-green-700">
                    Subido el {presupuesto.fechaSubida && formatDate(presupuesto.fechaSubida)}
                  </p>
                </div>
              </>
            ) : isActive ? (
              <>
                <Clock className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Pendiente de presupuesto</p>
                  <p className="text-sm text-blue-700">
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
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Ayuda para clientes */}
      {userRol === 'cliente' && !presupuesto && isActive && (
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

      {/* Modal de subida */}
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
