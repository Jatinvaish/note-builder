"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"

interface VoiceInputProps {
  onTranscribed: (text: string) => void
}

export function VoiceInput({ onTranscribed }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported")
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => setIsRecording(true)

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("")
      onTranscribed(text)
      setIsRecording(false)
    }

    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)

    recognition.start()
    recognitionRef.current = recognition
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <Button
      onClick={isRecording ? stopRecording : startRecording}
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      className="gap-1"
      type="button"
    >
      {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
      {isRecording ? "Stop" : "Voice"}
    </Button>
  )
}
