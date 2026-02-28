import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { orden: 'asc' },
    })

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error('Error obteniendo FAQs:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
