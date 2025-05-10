import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import dotenv from 'dotenv'
dotenv.config()


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req) {
const { text, formato } = await req.json()
const prompt =
  formato === 'libro'
    ? `Tu tarea es aplicar únicamente formato narrativo de libro al texto que te doy, sin modificar su contenido. No agregues palabras. No completes ideas. No inventes. No interpretes. Solo aplicá puntuación, tildes, mayúsculas y estructura de párrafos si lo ves necesario. No cambies el orden ni el contenido.`
    : `Tu tarea es aplicar únicamente formato de guion al texto que te doy. No agregues nombres, personajes, acotaciones ni frases. No escribas nada que no esté ya en el texto. Solamente aplicá el formato típico de un guion: nombres en mayúsculas si aparecen, división en líneas, y márgenes si es necesario. Mantené exactamente el contenido original.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
    {
      role: 'system',
      content: prompt,
    },
    {
      role: 'user',
      content: `Y recordá: está prohibido agregar contenido nuevo. Solo reformateá lo que se te da. Texto original:\n\n${text}.`,

    },
  ],
})

    return NextResponse.json({ script: completion.choices[0].message.content })
  } catch (error) {
      console.error('❌ Error en generación de guion:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
