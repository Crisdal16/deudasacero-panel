import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.auditLog.deleteMany()
  await prisma.mensaje.deleteMany()
  await prisma.pago.deleteMany()
  await prisma.facturacion.deleteMany()
  await prisma.firma.deleteMany()
  await prisma.checklistDocumento.deleteMany()
  await prisma.documentoJudicial.deleteMany()
  await prisma.documento.deleteMany()
  await prisma.deuda.deleteMany()
  await prisma.expediente.deleteMany()
  await prisma.fAQ.deleteMany()
  await prisma.usuario.deleteMany()

  console.log('✅ Datos existentes eliminados')

  // =============================================
  // CREAR USUARIOS
  // =============================================

  // Admin
  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@deudasacero.es',
      password: adminPassword,
      nombre: 'Administrador',
      telefono: '+34 900 123 456',
      nif: 'A12345678',
      rol: 'admin',
    },
  })
  console.log('✅ Usuario admin creado')

  // Abogado externo
  const abogadoPassword = await bcrypt.hash('Abogado123!', 10)
  const abogado = await prisma.usuario.create({
    data: {
      email: 'abogado@ejemplo.com',
      password: abogadoPassword,
      nombre: 'Dr. Carlos Martínez',
      telefono: '+34 666 111 222',
      rol: 'abogado',
    },
  })
  console.log('✅ Usuario abogado creado')

  // Cliente de prueba
  const clientePassword = await bcrypt.hash('Cliente123!', 10)
  const cliente = await prisma.usuario.create({
    data: {
      email: 'cliente@ejemplo.com',
      password: clientePassword,
      nombre: 'María García López',
      telefono: '+34 666 123 456',
      nif: '12345678A',
      rol: 'cliente',
    },
  })
  console.log('✅ Usuario cliente creado')

  // Segundo cliente
  const cliente2Password = await bcrypt.hash('Cliente123!', 10)
  const cliente2 = await prisma.usuario.create({
    data: {
      email: 'cliente2@ejemplo.com',
      password: cliente2Password,
      nombre: 'Juan Rodríguez Pérez',
      telefono: '+34 666 222 333',
      nif: '87654321B',
      rol: 'cliente',
    },
  })
  console.log('✅ Segundo cliente creado')

  // =============================================
  // CREAR EXPEDIENTES
  // =============================================

  const expediente1 = await prisma.expediente.create({
    data: {
      referencia: 'LSO-2024-001',
      clienteId: cliente.id,
      abogadoAsignadoId: abogado.id,
      juzgado: 'Juzgado de Primera Instancia nº 5 de Madrid',
      tipoProcedimiento: 'persona_fisica',
      faseActual: 3,
      porcentajeAvance: 45,
      fechaPresentacion: new Date('2024-01-15'),
      situacionLaboral: 'Desempleado/a',
      buenaFe: true,
      sinAntecedentes: true,
      estadoCivil: 'soltero',
      hijos: 0,
    },
  })
  console.log('✅ Primer expediente creado')

  const expediente2 = await prisma.expediente.create({
    data: {
      referencia: 'LSO-2024-002',
      clienteId: cliente2.id,
      abogadoAsignadoId: abogado.id,
      juzgado: 'Juzgado de Primera Instancia nº 3 de Barcelona',
      tipoProcedimiento: 'autonomo',
      faseActual: 1,
      porcentajeAvance: 10,
      situacionLaboral: 'Autónomo',
      buenaFe: true,
      sinAntecedentes: true,
      estadoCivil: 'casado',
      hijos: 2,
    },
  })
  console.log('✅ Segundo expediente creado')

  // =============================================
  // CREAR DEUDAS
  // =============================================

  await prisma.deuda.createMany({
    data: [
      {
        expedienteId: expediente1.id,
        tipo: 'financiera',
        importe: 25000,
        descripcion: 'Préstamo personal',
        acreedor: 'Banco Santander',
      },
      {
        expedienteId: expediente1.id,
        tipo: 'financiera',
        importe: 15000,
        descripcion: 'Tarjeta de crédito',
        acreedor: 'BBVA',
      },
      {
        expedienteId: expediente1.id,
        tipo: 'publica',
        importe: 3500,
        descripcion: 'Deuda tributaria',
        acreedor: 'AEAT',
      },
      {
        expedienteId: expediente1.id,
        tipo: 'publica',
        importe: 1200,
        descripcion: 'Cuotas SS autónomos',
        acreedor: 'Seguridad Social',
      },
      {
        expedienteId: expediente1.id,
        tipo: 'proveedores',
        importe: 5000,
        descripcion: 'Facturas pendientes',
        acreedor: 'Varios proveedores',
      },
      {
        expedienteId: expediente2.id,
        tipo: 'financiera',
        importe: 45000,
        descripcion: 'Préstamo ICO',
        acreedor: 'CaixaBank',
      },
      {
        expedienteId: expediente2.id,
        tipo: 'publica',
        importe: 8500,
        descripcion: 'Deuda Hacienda',
        acreedor: 'AEAT',
      },
    ],
  })
  console.log('✅ Deudas creadas')

  // =============================================
  // CREAR CHECKLIST
  // =============================================

  const checklistEstandar = [
    { nombre: 'DNI/NIE', orden: 1 },
    { nombre: 'IRPF últimos 2 años', orden: 2 },
    { nombre: 'Vida laboral completa', orden: 3 },
    { nombre: 'Certificado paro (si aplica)', orden: 4 },
    { nombre: 'Certificado empadronamiento', orden: 5 },
    { nombre: 'Extractos bancarios 6 meses', orden: 6 },
    { nombre: 'Certificado AEAT deudas', orden: 7 },
    { nombre: 'Certificado Seguridad Social', orden: 8 },
    { nombre: 'Escrituras propiedades (si aplica)', orden: 9 },
    { nombre: 'Contrato trabajo actual', orden: 10 },
    { nombre: 'Últimas 3 nóminas', orden: 11 },
    { nombre: 'Título académico (si aplica)', orden: 12 },
    { nombre: 'Certificado antecedentes penales', orden: 13 },
  ]

  for (const item of checklistEstandar) {
    await prisma.checklistDocumento.create({
      data: {
        expedienteId: expediente1.id,
        nombre: item.nombre,
        orden: item.orden,
        obligatorio: true,
      },
    })
  }

  for (const item of checklistEstandar) {
    await prisma.checklistDocumento.create({
      data: {
        expedienteId: expediente2.id,
        nombre: item.nombre,
        orden: item.orden,
        obligatorio: true,
      },
    })
  }
  console.log('✅ Checklists creados')

  // =============================================
  // CREAR DOCUMENTOS
  // =============================================

  await prisma.documento.createMany({
    data: [
      {
        expedienteId: expediente1.id,
        nombre: 'DNI.pdf',
        tipo: 'DNI',
        estado: 'revisado',
        fechaSubida: new Date('2024-01-10'),
        subidoPorId: cliente.id,
      },
      {
        expedienteId: expediente1.id,
        nombre: 'IRPF_2023.pdf',
        tipo: 'IRPF',
        estado: 'revisado',
        fechaSubida: new Date('2024-01-12'),
        subidoPorId: cliente.id,
      },
      {
        expedienteId: expediente1.id,
        nombre: 'Certificado_Paro.pdf',
        tipo: 'certificado',
        estado: 'subido',
        fechaSubida: new Date('2024-01-20'),
        subidoPorId: cliente.id,
      },
      {
        expedienteId: expediente1.id,
        nombre: 'Vida_Laboral.pdf',
        tipo: 'certificado',
        estado: 'revisado',
        fechaSubida: new Date('2024-01-11'),
        subidoPorId: cliente.id,
      },
    ],
  })
  console.log('✅ Documentos creados')

  // =============================================
  // CREAR MENSAJES
  // =============================================

  await prisma.mensaje.createMany({
    data: [
      {
        expedienteId: expediente1.id,
        usuarioId: admin.id,
        remitente: 'admin',
        texto: 'Bienvenido/a al área de cliente de Deudas a Cero. Desde aquí podrá seguir el estado de su expediente y comunicarse con nosotros.',
        fechaEnvio: new Date('2024-01-15T10:00:00'),
        leido: true,
      },
      {
        expedienteId: expediente1.id,
        usuarioId: cliente.id,
        remitente: 'cliente',
        texto: 'Muchas gracias. ¿Cuánto tiempo suele tardar el proceso?',
        fechaEnvio: new Date('2024-01-15T14:30:00'),
        leido: true,
      },
      {
        expedienteId: expediente1.id,
        usuarioId: abogado.id,
        remitente: 'abogado',
        texto: 'El proceso completo de la Ley de Segunda Oportunidad suele durar entre 12 y 18 meses.',
        fechaEnvio: new Date('2024-01-16T09:15:00'),
        leido: true,
      },
    ],
  })
  console.log('✅ Mensajes creados')

  // =============================================
  // CREAR FAQs
  // =============================================

  await prisma.fAQ.createMany({
    data: [
      {
        pregunta: '¿Qué es la Ley de Segunda Oportunidad?',
        respuesta: 'La Ley de Segunda Oportunidad (LSO) es un mecanismo legal que permite a personas físicas en situación de insolvencia obtener la exoneración de deudas que no pueden pagar, siempre que cumplan ciertos requisitos de buena fe.',
        orden: 1,
      },
      {
        pregunta: '¿Quién puede acogerse a la LSO?',
        respuesta: 'Pueden acogerse personas físicas (particulares y autónomos) que se encuentren en situación de insolvencia. Es necesario demostrar buena fe y no haber sido condenado por ciertos delitos económicos.',
        orden: 2,
      },
      {
        pregunta: '¿Qué deudas se pueden exonerar?',
        respuesta: 'Se pueden exonerar deudas con entidades financieras (préstamos, tarjetas, hipotecas), proveedores, y en parte deudas públicas (Hacienda y Seguridad Social). Las deudas por alimentos no son exonerables.',
        orden: 3,
      },
      {
        pregunta: '¿Cuánto dura el proceso?',
        respuesta: 'El proceso completo suele durar entre 12 y 18 meses, dependiendo del juzgado y la complejidad del caso. Durante este tiempo se nombra un mediador concursal y se intenta llegar a un acuerdo con los acreedores.',
        orden: 4,
      },
    ],
  })
  console.log('✅ FAQs creados')

  console.log('🎉 Seed completado exitosamente')
  console.log('')
  console.log('📧 CREDENCIALES DE PRUEBA:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 Admin:    admin@deudasacero.es / Admin123!')
  console.log('⚖️  Abogado:  abogado@ejemplo.com / Abogado123!')
  console.log('👤 Cliente:  cliente@ejemplo.com / Cliente123!')
  console.log('👤 Cliente2: cliente2@ejemplo.com / Cliente123!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
