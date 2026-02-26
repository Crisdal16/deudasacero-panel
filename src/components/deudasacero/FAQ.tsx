'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Mail, Phone, MapPin } from 'lucide-react'

interface FAQ {
  id: string
  pregunta: string
  respuesta: string
  orden: number
}

interface FAQProps {
  faqs: FAQ[]
}

export function FAQSection({ faqs }: FAQProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Preguntas Frecuentes</h1>
        <p className="text-gray-600">Respuestas a las dudas más comunes sobre la Ley de Segunda Oportunidad</p>
      </div>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <HelpCircle className="w-5 h-5" />
            Sobre la Ley de Segunda Oportunidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.id} value={`item-${index}`}>
                <AccordionTrigger className="text-left hover:text-blue-900">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200">
                      {index + 1}
                    </Badge>
                    {faq.pregunta}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pl-10">
                  {faq.respuesta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="text-blue-900">¿Necesitas más ayuda?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Si tienes dudas específicas sobre tu expediente o necesitas asistencia personalizada, 
            no dudes en contactar con nuestro equipo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-blue-900">+34 900 123 456</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-blue-900">info@deudasacero.es</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium text-blue-900">Calle Principal, 123, Madrid</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información legal */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-blue-900">Información Legal</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm text-gray-600">
          <p>
            La Ley de Segunda Oportunidad (LSO) está regulada en el Título X de la Ley 22/2003, 
            de 9 de julio, Concursal, modificada por la Ley 1/2019, de 20 de febrero, 
            de mecanismos de segunda oportunidad, reducción de la carga financiera y otras 
            medidas de orden social.
          </p>
          <p className="mt-4">
            Este mecanismo permite a las personas físicas en situación de insolvencia 
            obtener la exoneración del pasivo insatisfecho, siempre que cumplan los 
            requisitos establecidos en la normativa concursal y actúen de buena fe.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
