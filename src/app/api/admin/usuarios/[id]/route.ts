import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE - Eliminar usuario (cliente o abogado)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params

      // Verificar que el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          _count: {
            select: {
              expedientesComoCliente: true,
              expedientesComoAbogado: true,
            },
          },
        },
      })

      if (!usuario) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      // No permitir eliminar admins
      if (usuario.rol === 'admin') {
        return NextResponse.json(
          { error: 'No se pueden eliminar usuarios administradores' },
          { status: 403 }
        )
      }

      // Verificar si tiene expedientes asociados
      const totalExpedientes = usuario._count.expedientesComoCliente + usuario._count.expedientesComoAbogado
      
      if (totalExpedientes > 0) {
        return NextResponse.json(
          { 
            error: `No se puede eliminar el usuario porque tiene ${totalExpedientes} expediente(s) asociado(s). Desactiva el usuario o reasigna los expedientes primero.` 
          },
          { status: 400 }
        )
      }

      // Eliminar usuario (cascade se encarga de limpiar relaciones)
      await prisma.usuario.delete({
        where: { id },
      })

      return NextResponse.json({
        success: true,
        message: `Usuario ${usuario.nombre} (${usuario.email}) eliminado correctamente`,
      })
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}

// PATCH - Activar/Desactivar usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const { activo } = body

      // Verificar que el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: { id: true, nombre: true, rol: true },
      })

      if (!usuario) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      // Actualizar estado
      const updated = await prisma.usuario.update({
        where: { id },
        data: { activo },
      })

      return NextResponse.json({
        success: true,
        usuario: {
          id: updated.id,
          nombre: updated.nombre,
          activo: updated.activo,
        },
      })
    } catch (error) {
      console.error('Error actualizando usuario:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })
}
