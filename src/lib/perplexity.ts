// Cliente de Perplexity AI - Compatible con formato OpenAI
// Documentación: https://docs.perplexity.ai/

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || ''
const PERPLEXITY_API_URL = 'https://api.perplexity.ai'

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface PerplexityRequest {
  model: string
  messages: PerplexityMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  return_related_questions?: boolean
}

export interface PerplexityResponse {
  id: string
  model: string
  choices: {
    index: number
    finish_reason: string
    message: {
      role: string
      content: string
    }
    delta?: {
      role: string
      content: string
    }
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  citations?: string[]
  related_questions?: string[]
}

// Modelos disponibles en Perplexity
export const PERPLEXITY_MODELS = {
  // Modelos con acceso a internet en tiempo real
  SONAR_SMALL: 'llama-3.1-sonar-small-128k-online',   // Más económico
  SONAR_LARGE: 'llama-3.1-sonar-large-128k-online',   // Mejor calidad
  SONAR_HUGE: 'llama-3.1-sonar-huge-128k-online',     // Máxima calidad
  
  // Modelos sin acceso a internet (más rápidos)
  SONAR_SMALL_CHAT: 'llama-3.1-sonar-small-128k-chat',
  SONAR_LARGE_CHAT: 'llama-3.1-sonar-large-128k-chat',
} as const

// Función principal para llamar a Perplexity
export async function callPerplexity(
  messages: PerplexityMessage[],
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
  } = {}
): Promise<string> {
  const {
    model = PERPLEXITY_MODELS.SONAR_LARGE,
    maxTokens = 4000,
    temperature = 0.7
  } = options

  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY no está configurada')
  }

  const request: PerplexityRequest = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    top_p: 0.9,
    return_related_questions: false
  }

  try {
    const response = await fetch(`${PERPLEXITY_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Error de Perplexity API:', errorData)
      throw new Error(`Error de Perplexity API: ${response.status} - ${errorData}`)
    }

    const data: PerplexityResponse = await response.json()
    
    return data.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Error llamando a Perplexity:', error)
    throw error
  }
}

// Función para generación de documentos legales
export async function generateLegalDocument(
  prompt: string,
  systemPrompt: string = 'Eres un abogado experto en la Ley de Segunda Oportunidad española. Generas documentos legales formales, precisos y profesionalmente estructurados.'
): Promise<string> {
  const messages: PerplexityMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ]

  return callPerplexity(messages, {
    model: PERPLEXITY_MODELS.SONAR_LARGE,
    maxTokens: 4000,
    temperature: 0.5 // Menor temperatura para documentos más consistentes
  })
}

// Función para investigación legal con acceso a internet
export async function legalResearch(
  query: string,
  context?: string
): Promise<{ respuesta: string; citas?: string[] }> {
  const systemPrompt = `Eres un asistente legal experto en la Ley de Segunda Oportunidad española y derecho concursal.
Proporcionas respuestas detalladas con referencias a legislación aplicable (Ley 1/2015, Ley 22/2003, etc.).
Cuando sea relevante, citás artículos de ley, jurisprudencia y normativas.
${context ? `\nContexto adicional: ${context}` : ''}`

  const messages: PerplexityMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query }
  ]

  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY no está configurada')
  }

  try {
    const response = await fetch(`${PERPLEXITY_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODELS.SONAR_LARGE, // Usamos el modelo online para investigación
        messages,
        max_tokens: 4000,
        temperature: 0.7,
        return_related_questions: false
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Error de Perplexity API: ${response.status}`)
    }

    const data: PerplexityResponse = await response.json()
    
    return {
      respuesta: data.choices[0]?.message?.content || '',
      citas: data.citations
    }
  } catch (error) {
    console.error('Error en investigación legal:', error)
    throw error
  }
}

// Exportar todas las funciones y constantes como módulo nombrado
const perplexityClient = {
  callPerplexity,
  generateLegalDocument,
  legalResearch,
  PERPLEXITY_MODELS
}

export default perplexityClient
