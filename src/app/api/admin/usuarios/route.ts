import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const rol = searchParams.get('rol')

      const where: any = {}
      if (rol) where.rol = rol

      const usuarios = await prisma.usuario.findMany({
        where,
        select: {
          id: true,
          email: true,
          nombre: true,
          telefono: true,
          nif: true,
          rol: true,
          activo: true,
          ultimoAcceso: true,
          createdAt: true,
          _count: {
            select: {
              expedientesComoCliente: true,
              expedientesComoAbogado: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ usuarios })
    } catch (error) {
      console.error('Error obteniendo usuarios:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}
