import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      configured: !!process.env.DATABASE_URL,
      connected: false,
      tablesExist: false,
      userCount: 0,
      error: null as string | null
    },
    jwt: {
      configured: !!process.env.JWT_SECRET
    }
  }

  // Verificar conexión a base de datos
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database.connected = true
    
    // Verificar si existen las tablas
    const userCount = await prisma.usuario.count()
    checks.database.userCount = userCount
    checks.database.tablesExist = true
  } catch (error: any) {
    checks.database.error = error?.message || 'Error desconocido'
  }

  const isHealthy = checks.database.connected && checks.database.tablesExist

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks
    },
    { status: isHealthy ? 200 : 500 }
  )
}
