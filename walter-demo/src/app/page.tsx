'use client'

import { useState, useRef } from 'react'
import { jsPDF } from 'jspdf'

export default function Home() {
  const [recording, setRecording] = useState<boolean>(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string>('')
  const [script, setScript] = useState<string>('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const [formato, setFormato] = useState<'libro' | 'guion'>('guion')

  

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorderRef.current = new MediaRecorder(stream)
    mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => chunks.current.push(e.data)
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      setAudioURL(url)
      const file = new File([blob], 'audio.webm')
      chunks.current = []

      const formData = new FormData()
      formData.append('file', file)
      formData.append('model', 'whisper-1')

      const whisperRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      const whisperData = await whisperRes.json()
      setTranscription(whisperData.text)

      console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY)


      const gptRes = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: whisperData.text, formato }) // ✅ ahora también mandamos el formato
      })
      const gptData = await gptRes.json()
      setScript(gptData.script)
    }

    mediaRecorderRef.current.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Walter Script Demo</h1>
      <div className="mb-4 flex gap-4">
  <button
    className={`px-4 py-2 rounded ${formato === 'guion' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
    onClick={() => setFormato('guion')}
  >
    Formato guion
  </button>
  <button
    className={`px-4 py-2 rounded ${formato === 'libro' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
    onClick={() => setFormato('libro')}
  >
    Formato libro
  </button>
</div>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={recording ? stopRecording : startRecording}
      >
        {recording ? 'Detener grabación' : 'Comenzar grabación'}
      </button>

      {audioURL && (
        <div className="mt-4">
          <audio controls src={audioURL} />
        </div>
      )}

      {transcription && (
        <div className="mt-4">
          <h2 className="font-semibold">Transcripción:</h2>
          <p>{transcription}</p>
        </div>
      )}

      {script && (
  <div className="mt-6">
    <h2 className="text-xl font-bold mb-3 text-gray-800">📝 Resultado:</h2>

    {/* Formato GUION */}
    {formato === 'guion' ? (
      <div className="bg-gray-50 text-black font-mono whitespace-pre-wrap p-6 rounded-xl shadow-md border-l-8 border-blue-500 leading-relaxed text-[15px] tracking-wide space-y-2">
        {script}
      </div>
    ) : (
      // Formato LIBRO
      <div className="bg-white text-gray-800 font-serif whitespace-pre-wrap p-8 rounded-xl shadow-md border border-gray-300 leading-8 text-[16px] tracking-normal italic">
        <p className="text-center font-bold text-xl mb-4">Walter Script</p>
        {script}
      </div>
    )}

    {/* Botón de descarga */}
    <div className="mt-4">
      <button
        onClick={() => descargarComoPDF(script)}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
      >
        Descargar como PDF
      </button>
    </div>
  </div>
)}


    </div>
  )
}

const descargarComoPDF = (contenido: string) => {
  const doc = new jsPDF()
  const margin = 10
  const lineHeight = 10
  const maxLineWidth = 180 // Ancho útil del PDF en mm
  const lines = doc.splitTextToSize(contenido, maxLineWidth)

  doc.setFont('Times', 'normal')
  doc.setFontSize(12)
  doc.text(lines, margin, margin + lineHeight)

  doc.save('walter-script.pdf')
}



