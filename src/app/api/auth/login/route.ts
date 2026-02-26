import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar que tenemos conexión a base de datos
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL no está configurada')
      return NextResponse.json(
        { error: 'Error de configuración: DATABASE_URL no definida' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    await createSession(user)

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
    console.error('Error en login:', error)
    
    // Proporcionar más detalles del error
    const errorMessage = error?.message || 'Error desconocido'
    const errorCode = error?.code || 'UNKNOWN'
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'production' ? undefined : errorMessage,
        code: errorCode
      },
      { status: 500 }
    )
  }
}
