import { NextRequest, NextResponse } from 'next/server'
import { withAuth, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// PATCH - Actualizar perfil del usuario
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email,
      telefono,
      direccion,
      codigoPostal,
      ciudad,
      facturacionNombre,
      facturacionNif,
      facturacionDireccion,
      facturacionCodigoPostal,
      facturacionCiudad,
      numeroColegiado,
    } = body

    // Si cambia el email, verificar que no exista
    if (email && email !== user.email) {
      const existingUser = await prisma.usuario.findUnique({
        where: { email },
      })
      if (existingUser) {
        return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 })
      }
    }

    // Preparar datos de facturación
    const datosFacturacion = (facturacionNombre || facturacionNif || facturacionDireccion) ? {
      nombre: facturacionNombre || '',
      nif: facturacionNif || '',
      direccion: facturacionDireccion || '',
      codigoPostal: facturacionCodigoPostal || '',
      ciudad: facturacionCiudad || '',
    } : null

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: user.userId },
      data: {
        email: email || user.email,
        telefono,
        direccion,
        codigoPostal,
        ciudad,
        // Solo abogados pueden actualizar número de colegiado
        ...(user.rol === 'abogado' && numeroColegiado !== undefined && { numeroColegiado }),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        nif: true,
        rol: true,
        direccion: true,
        codigoPostal: true,
        ciudad: true,
        numeroColegiado: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      usuario: usuarioActualizado,
    })
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el perfil: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

// GET - Obtener perfil completo del usuario
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        nif: true,
        rol: true,
        direccion: true,
        codigoPostal: true,
        ciudad: true,
        numeroColegiado: true,
        activo: true,
        createdAt: true,
        ultimoAcceso: true,
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ usuario })
  } catch (error) {
    console.error('Error obteniendo perfil:', error)
    return NextResponse.json(
      { error: 'Error al obtener el perfil' },
      { status: 500 }
    )
  }
}
