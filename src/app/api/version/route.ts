import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: '2.0.0',
    lastUpdate: '2026-02-26T18:00:00Z',
    features: {
      adminPanel: {
        tabs: ['expedientes', 'clientes', 'abogados'],
        createClient: true,
        createClientWithExpedient: true,
      },
      abogadoPanel: {
        documentManagement: true,
        messageManagement: true,
      },
      documentos: {
        dragAndDrop: true,
        base64Storage: true,
      },
      mensajes: {
        clienteAbogadoAdmin: true,
        fileAttachment: true,
      },
      perfil: {
        editable: true,
        passwordChange: true,
      }
    },
    commitTime: new Date().toISOString()
  })
}
