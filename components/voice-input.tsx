"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2 } from "lucide-react"

interface VoiceInputProps {
  onTranscribed: (text: string) => void
  selectedFieldKey: string | null
}

export function VoiceInput({ onTranscribed, selectedFieldKey }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<any>(null)

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser")
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("")

      setTranscript(text)
      if (selectedFieldKey) {
        onTranscribed(text)
      }
      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.start()
    recognitionRef.current = recognition
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const clearTranscript = () => {
    setTranscript("")
  }

  return (
    <div className="border border-border rounded p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs font-semibold">Voice Input</p>
      </div>

      <Button
        onClick={isRecording ? stopRecording : startRecording}
        variant={isRecording ? "destructive" : "default"}
        size="sm"
        className="w-full gap-2"
      >
        {isRecording ? (
          <>
            <MicOff className="w-4 h-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Start Speaking
          </>
        )}
      </Button>

      {transcript && (
        <div className="space-y-2">
          <div className="bg-background p-2 rounded border border-border text-xs min-h-12">
            <p className="text-foreground">{transcript}</p>
          </div>
          <Button onClick={clearTranscript} variant="outline" size="sm" className="w-full text-xs bg-transparent">
            Clear
          </Button>
        </div>
      )}

      {isRecording && <p className="text-[10px] text-muted-foreground animate-pulse">Listening...</p>}
    </div>
  )
}
