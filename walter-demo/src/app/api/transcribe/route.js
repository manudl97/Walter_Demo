import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import formidable from 'formidable'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()


export const config = {
  api: {
    bodyParser: false,
  },
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req) {
  const data = await req.formData()
  const file = data.get('file')

  // Guardar temporalmente
  const buffer = Buffer.from(await file.arrayBuffer())
const tempPath = `./public/audio-${Date.now()}.webm`
  fs.writeFileSync(tempPath, buffer)

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-1',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
      console.error('❌ Error en transcripción:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
