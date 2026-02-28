import { NextRequest, NextResponse } from 'next/server'
import { registerUser, createSession } from '@/lib/auth'
import { sendWelcomeEmail, sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, email, password, telefono, nif } = body

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Generar token de verificación
    const tokenVerificacion = randomBytes(32).toString('hex')
    const tokenVerificacionExpira = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    const user = await registerUser({ 
      nombre, 
      email, 
      password, 
      telefono, 
      nif,
      tokenVerificacion,
      tokenVerificacionExpira
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 }
      )
    }

    await createSession(user)

    // Enviar email de bienvenida
    try {
      await sendWelcomeEmail(email, nombre)
    } catch (emailError) {
      console.error('Error enviando email de bienvenida:', emailError)
      // No fallar el registro si el email falla
    }

    // Enviar email de verificación
    try {
      await sendVerificationEmail(email, nombre, tokenVerificacion)
    } catch (emailError) {
      console.error('Error enviando email de verificación:', emailError)
      // No fallar el registro si el email falla
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    })
  } catch (error: any) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 400 }
    )
  }
}
