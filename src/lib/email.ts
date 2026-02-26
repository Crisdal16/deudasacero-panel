import { Resend } from 'resend'

// Inicializar Resend (gratuito hasta 3000 emails/mes)
const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailData {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Email de bienvenida
export function getWelcomeEmailTemplate(nombre: string): EmailTemplate {
  return {
    subject: '¡Bienvenido a Deudas a Cero! - Tu camino hacia la segunda oportunidad',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #166534 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Deudas a Cero</h1>
            <p>Tu segunda oportunidad financiera empieza aquí</p>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            <p>Te damos la bienvenida a <strong>Deudas a Cero</strong>, tu plataforma para iniciar el proceso de la Ley de Segunda Oportunidad.</p>
            <p>Hemos creado tu cuenta personal donde podrás:</p>
            <ul>
              <li>📄 Ver el estado de tu expediente en tiempo real</li>
              <li>📁 Subir la documentación necesaria</li>
              <li>💬 Comunicarte directamente con tu abogado</li>
              <li>📊 Seguir el progreso de cada fase del proceso</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://deudasacero-panel.vercel.app" class="button">Acceder a mi panel</a>
            </p>
            <p><strong>Próximos pasos:</strong></p>
            <ol>
              <li>Sube la documentación solicitada en la sección "Documentos"</li>
              <li>Revisa el checklist de documentos necesarios</li>
              <li>Si tienes dudas, usa el chat de mensajes</li>
            </ol>
            <p>Estamos aquí para ayudarte a empezar de nuevo. 💪</p>
          </div>
          <div class="footer">
            <p>Deudas a Cero | info@deudasacero.com</p>
            <p>Este email fue enviado a ${nombre}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
¡Hola ${nombre}!

Te damos la bienvenida a Deudas a Cero, tu plataforma para iniciar el proceso de la Ley de Segunda Oportunidad.

Hemos creado tu cuenta personal donde podrás:
- Ver el estado de tu expediente en tiempo real
- Subir la documentación necesaria
- Comunicarte directamente con tu abogado
- Seguir el progreso de cada fase del proceso

Accede a tu panel: https://deudasacero-panel.vercel.app

Próximos pasos:
1. Sube la documentación solicitada en la sección "Documentos"
2. Revisa el checklist de documentos necesarios
3. Si tienes dudas, usa el chat de mensajes

Estamos aquí para ayudarte a empezar de nuevo.

Deudas a Cero
info@deudasacero.com
    `,
  }
}

// Email de verificación
export function getVerificationEmailTemplate(nombre: string, verificationUrl: string): EmailTemplate {
  return {
    subject: 'Verifica tu email - Deudas a Cero',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a5f; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #166534; color: white; text-decoration: none; border-radius: 6px; }
          .code { background: #e5e7eb; padding: 10px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Verificación de Email</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre}</h2>
            <p>Para completar tu registro, necesitamos verificar tu dirección de email.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verificar mi email</a>
            </p>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">${verificationUrl}</p>
            <p><small>Este enlace expira en 24 horas.</small></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hola ${nombre},

Para completar tu registro, necesitamos verificar tu dirección de email.

Haz clic en el siguiente enlace o cópialo en tu navegador:
${verificationUrl}

Este enlace expira en 24 horas.
    `,
  }
}

// Email de cambio de fase
export function getPhaseChangeEmailTemplate(
  nombre: string, 
  faseAnterior: number, 
  faseNueva: number, 
  nombreFase: string,
  descripcionFase: string,
  referencia: string
): EmailTemplate {
  return {
    subject: `Actualización de tu expediente ${referencia} - Fase ${faseNueva}: ${nombreFase}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #166534 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .phase { background: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .phase-number { font-size: 48px; font-weight: bold; color: #1e3a5f; }
          .progress { background: #e5e7eb; height: 8px; border-radius: 4px; margin: 10px 0; }
          .progress-bar { background: #166534; height: 8px; border-radius: 4px; }
          .button { display: inline-block; padding: 12px 24px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Tu expediente ha avanzado</h1>
            <p>Referencia: ${referencia}</p>
          </div>
          <div class="content">
            <h2>Hola ${nombre}</h2>
            <p>Tu expediente ha pasado a una nueva fase:</p>
            
            <div class="phase">
              <p style="margin:0; color: #666;">Fase anterior</p>
              <p style="font-size: 24px; margin: 5px 0;">${faseAnterior}</p>
              <p style="font-size: 24px;">↓</p>
              <p style="margin:0; color: #166534; font-weight: bold;">Nueva fase</p>
              <p class="phase-number">${faseNueva}</p>
              <p style="font-size: 18px; font-weight: bold; color: #1e3a5f; margin: 0;">${nombreFase}</p>
            </div>
            
            <p><strong>¿Qué significa?</strong></p>
            <p>${descripcionFase}</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://deudasacero-panel.vercel.app" class="button">Ver mi expediente</a>
            </p>
            
            <p><small>Si necesitas subir documentación, entra en tu panel y ve a la sección "Documentos".</small></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hola ${nombre},

Tu expediente ${referencia} ha avanzado a una nueva fase.

Fase anterior: ${faseAnterior}
Nueva fase: ${faseNueva} - ${nombreFase}

${descripcionFase}

Accede a tu panel para más detalles: https://deudasacero-panel.vercel.app
    `,
  }
}

// Email de nuevo mensaje
export function getNewMessageEmailTemplate(
  nombre: string,
  remitente: string,
  previewText: string,
  referencia?: string
): EmailTemplate {
  return {
    subject: `💬 Nuevo mensaje de ${remitente} - Deudas a Cero`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .message { background: white; padding: 20px; border-left: 4px solid #1e3a5f; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 Tienes un nuevo mensaje</h1>
            ${referencia ? `<p>Expediente: ${referencia}</p>` : ''}
          </div>
          <div class="content">
            <h2>Hola ${nombre}</h2>
            <p>Has recibido un nuevo mensaje de <strong>${remitente}</strong>:</p>
            
            <div class="message">
              <p style="margin: 0;">"${previewText.substring(0, 200)}${previewText.length > 200 ? '...' : ''}"</p>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://deudasacero-panel.vercel.app" class="button">Responder mensaje</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hola ${nombre},

Has recibido un nuevo mensaje de ${remitente}:

"${previewText.substring(0, 200)}${previewText.length > 200 ? '...' : ''}"

Responde en: https://deudasacero-panel.vercel.app
    `,
  }
}

// Email de solicitud de documentos
export function getDocumentRequestEmailTemplate(
  nombre: string,
  documentos: string[],
  referencia: string
): EmailTemplate {
  return {
    subject: `📄 Documentación pendiente - ${referencia}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          ul { background: white; padding: 20px 40px; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Documentación Pendiente</h1>
            <p>Expediente: ${referencia}</p>
          </div>
          <div class="content">
            <h2>Hola ${nombre}</h2>
            <p>Necesitamos que subas la siguiente documentación:</p>
            
            <ul>
              ${documentos.map(doc => `<li>${doc}</li>`).join('')}
            </ul>
            
            <p>Puedes subir los documentos directamente desde tu panel.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://deudasacero-panel.vercel.app" class="button">Subir documentos</a>
            </p>
            
            <p><small>Si tienes dudas sobre algún documento, contacta con tu abogado a través del chat.</small></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hola ${nombre},

Necesitamos que subas la siguiente documentación para tu expediente ${referencia}:

${documentos.map(doc => `- ${doc}`).join('\n')}

Sube los documentos en: https://deudasacero-panel.vercel.app
    `,
  }
}

// Función principal para enviar emails
export async function sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Si no hay API key de Resend, log y simular éxito
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [DEV] Email simulado:', {
        to: data.to,
        subject: data.subject,
        from: data.from || 'Deudas a Cero <noreply@deudasacero.com>',
      })
      return { success: true }
    }

    const { data: result, error } = await resend.emails.send({
      from: data.from || 'Deudas a Cero <noreply@deudasacero.com>',
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text,
    })

    if (error) {
      console.error('Error enviando email:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email enviado:', result?.id)
    return { success: true }
  } catch (error) {
    console.error('Error enviando email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Funciones de conveniencia
export async function sendWelcomeEmail(to: string, nombre: string) {
  const template = getWelcomeEmailTemplate(nombre)
  return sendEmail({ to, ...template })
}

export async function sendVerificationEmail(to: string, nombre: string, token: string) {
  const verificationUrl = `https://deudasacero-panel.vercel.app/verificar?token=${token}`
  const template = getVerificationEmailTemplate(nombre, verificationUrl)
  return sendEmail({ to, ...template })
}

export async function sendPhaseChangeEmail(
  to: string,
  nombre: string,
  faseAnterior: number,
  faseNueva: number,
  nombreFase: string,
  descripcionFase: string,
  referencia: string
) {
  const template = getPhaseChangeEmailTemplate(nombre, faseAnterior, faseNueva, nombreFase, descripcionFase, referencia)
  return sendEmail({ to, ...template })
}

export async function sendNewMessageEmail(
  to: string,
  nombre: string,
  remitente: string,
  previewText: string,
  referencia?: string
) {
  const template = getNewMessageEmailTemplate(nombre, remitente, previewText, referencia)
  return sendEmail({ to, ...template })
}

export async function sendDocumentRequestEmail(
  to: string,
  nombre: string,
  documentos: string[],
  referencia: string
) {
  const template = getDocumentRequestEmailTemplate(nombre, documentos, referencia)
  return sendEmail({ to, ...template })
}
