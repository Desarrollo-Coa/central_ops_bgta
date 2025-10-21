"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Clock,
  Sun,
  Moon,
  Volume2,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  MessageSquare,
  FileText, 
} from "lucide-react"

interface ReportSystemProps {
  user: string
  shift: "diurno" | "nocturno" | "turno_b" | ""
  onBack: () => void
  idCumplido?: number
}

interface ChatMessage {
  id: string
  type: "user" | "system"
  content: string
  timestamp: Date
  isAudio?: boolean
  audioBlob?: Blob
  audioUrl?: string
  duration?: string
  messageType?: "reporte" | "evidencia" | "comunicacion"
}

// Componente para visualización de frecuencia de audio
const AudioWaveform = ({ isPlaying, duration = "0:00" }: { isPlaying: boolean; duration?: string }) => {
  const bars = Array.from({ length: 12 }, (_, i) => Math.random() * 60 + 20) // Menos barras y altura más baja
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {bars.map((height, index) => (
          <div
            key={index}
            className={`w-0.5 bg-white rounded-full transition-all duration-300 ${
              isPlaying ? 'animate-pulse' : ''
            }`}
            style={{ 
              height: `${height}%`,
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>
      <span className="text-xs text-white/70 font-mono ml-2">{duration}</span>
    </div>
  )
}

export default function ReportSystem({ user, shift, onBack, idCumplido: propIdCumplido }: ReportSystemProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [idCumplido, setIdCumplido] = useState<number | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Obtener ID del cumplido y cargar mensajes reales
  useEffect(() => {
    const obtenerCumplidoYcargarMensajes = async () => {
      try {
        setLoading(true);
        
        // Si ya tenemos el ID del cumplido desde props, usarlo directamente
        if (propIdCumplido) {
          setIdCumplido(propIdCumplido);
          
 
          // Cargar mensajes reales usando el ID del cumplido
          const mensajesResponse = await fetch(`/api/comunicacion/mensajes?idCumplido=${propIdCumplido}`, {
            credentials: 'include' // Asegurar que se envíen las cookies
          });

          if (mensajesResponse.ok) {
            const mensajesData = await mensajesResponse.json();
            
            // Convertir mensajes de la base de datos al formato del componente
            const mensajesConvertidos: ChatMessage[] = mensajesData.mensajes.map((msg: any) => ({
              id: msg.id.toString(),
              type: "user",
              content: msg.contenido,
              timestamp: new Date(msg.fecha_creacion),
              isAudio: msg.tipo_mensaje === 'audio',
              audioUrl: msg.audio_url,
              duration: msg.duracion ? formatDuration(msg.duracion) : undefined,
              messageType: "reporte"
            }));

            // Agregar mensaje inicial del sistema
            const today = new Date();
            const formattedDate = today.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            const getTurnoDisplayName = (shift: string) => {
              switch (shift) {
                case "diurno": return "Diurno";
                case "nocturno": return "Nocturno";
                case "turno_b": return "Turno B";
                default: return "Sin turno";
              }
            };

            const initialMessage: ChatMessage = {
              id: "system-1",
              type: "system",
              content: `${formattedDate} - ${getTurnoDisplayName(shift)}`,
              timestamp: new Date(),
              messageType: "comunicacion"
            };

            setMessages([initialMessage, ...mensajesConvertidos]);
          }
        } else {
          console.error('No se proporcionó ID de cumplido');
        }
      } catch (error) {
        console.error('Error cargando mensajes:', error);
      } finally {
        setLoading(false);
      }
    };

    obtenerCumplidoYcargarMensajes();
  }, [shift, propIdCumplido]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Timer para grabación
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        setRecordingDuration(0)
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
        
        // Calcular duración real del audio
        const duration = formatDuration(recordingDuration)
        
        // Enviar audio al servidor
        await enviarMensajeAudio(audioBlob, duration)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("No se pudo acceder al micrófono")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const enviarMensajeAudio = async (audioBlob: Blob, duration: string) => {
    if (!idCumplido) {
      console.error('No hay ID de cumplido disponible');
      return;
    }

    try {
      setSending(true);

      // No necesitamos obtener el token manualmente, las APIs lo manejan desde cookies

      // Obtener ubicación
      let latitud = null;
      let longitud = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true
          });
        });
        latitud = position.coords.latitude;
        longitud = position.coords.longitude;
      } catch (error) {
        console.log('No se pudo obtener la ubicación:', error);
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('contenido', 'Reporte de voz');
      formData.append('tipoMensaje', 'audio');
      formData.append('idCumplido', idCumplido.toString());
      formData.append('audioFile', audioBlob, 'audio.wav');
      if (latitud) formData.append('latitud', latitud.toString());
      if (longitud) formData.append('longitud', longitud.toString());

      // Enviar al servidor
      const response = await fetch('/api/comunicacion/mensajes', {
        method: 'POST',
        credentials: 'include', // Asegurar que se envíen las cookies
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar mensaje de audio');
      }

      const data = await response.json();
      
      // Agregar mensaje a la lista local
      const audioMessage: ChatMessage = {
        id: data.mensajeId.toString(),
        type: "user",
        content: "Reporte de voz",
        timestamp: new Date(),
        isAudio: true,
        audioUrl: data.audioUrl,
        duration: duration,
        messageType: "reporte"
      };
      
      setMessages(prev => [...prev, audioMessage]);
      console.log('✅ Mensaje de audio enviado exitosamente');

    } catch (error: any) {
      console.error('Error enviando mensaje de audio:', error);
      alert(`Error al enviar mensaje de audio: ${error.message}`);
    } finally {
      setSending(false);
    }
  }

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    const audio = new Audio(audioUrl)
    audio.onended = () => setIsPlaying(false)
    audio.onplay = () => setIsPlaying(true)
    audio.onpause = () => setIsPlaying(false)
    
    audio.play()
    setCurrentAudio(audio)
  }

  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      setIsPlaying(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !idCumplido) return

    try {
      setSending(true);

      // No necesitamos obtener el token manualmente, las APIs lo manejan desde cookies

      // Obtener ubicación
      let latitud = null;
      let longitud = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true
          });
        });
        latitud = position.coords.latitude;
        longitud = position.coords.longitude;
      } catch (error) {
        console.log('No se pudo obtener la ubicación:', error);
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('contenido', inputMessage);
      formData.append('tipoMensaje', 'texto');
      formData.append('idCumplido', idCumplido.toString());
      if (latitud) formData.append('latitud', latitud.toString());
      if (longitud) formData.append('longitud', longitud.toString());

      // Enviar al servidor
      const response = await fetch('/api/comunicacion/mensajes', {
        method: 'POST',
        credentials: 'include', // Asegurar que se envíen las cookies
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar mensaje');
      }

      const data = await response.json();
      
      // Agregar mensaje a la lista local
      const userMessage: ChatMessage = {
        id: data.mensajeId.toString(),
        type: "user",
        content: inputMessage,
        timestamp: new Date(),
        messageType: "reporte"
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage("");
      console.log('✅ Mensaje de texto enviado exitosamente');

    } catch (error: any) {
      console.error('Error enviando mensaje de texto:', error);
      alert(`Error al enviar mensaje: ${error.message}`);
    } finally {
      setSending(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-ES", { 
      hour: "2-digit", 
      minute: "2-digit" 
    })
  }

  const formatDuration = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMessageTypeIcon = (messageType?: string) => {
    switch (messageType) {
      case "reporte":
        return <FileText className="w-4 h-4" />
      case "evidencia":
        return <MessageSquare className="w-4 h-4" />
      case "comunicacion":
        return <Clock className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  // Agrupar mensajes por fecha
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = []
    
    messages.slice(1).forEach((message) => {
      const messageDate = formatDate(message.timestamp)
      const existingGroup = groups.find(group => group.date === messageDate)
      
      if (existingGroup) {
        existingGroup.messages.push(message)
      } else {
        groups.push({
          date: messageDate,
          messages: [message]
        })
      }
    })
    
    return groups
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center gap-3">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
              {shift === "diurno" ? <Sun className="w-6 h-6" /> : 
               shift === "nocturno" ? <Moon className="w-6 h-6" /> : 
               shift === "turno_b" ? <Clock className="w-6 h-6" /> : 
               <Clock className="w-6 h-6" />}
            </div>
          <div>
              <h1 className="font-semibold text-white">Reportes de Comunicación</h1>
              <p className="text-xs text-zinc-400">{user}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-zinc-400 text-sm">Cargando mensajes...</p>
              </div>
            </div>
          ) : !idCumplido ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-zinc-400" />
                </div>
                <p className="text-zinc-400 text-sm mb-2">No hay turno seleccionado</p>
                <p className="text-zinc-500 text-xs">Selecciona un turno para poder enviar mensajes</p>
              </div>
            </div>
          ) : groupMessagesByDate().map((group, groupIndex) => (
            <div key={group.date}>
              {/* Fecha centrada */}
              <div className="flex justify-center mb-6">
                <div className="text-xs text-zinc-500 text-center">
                  {group.date}
            </div>
            </div>

              {/* Mensajes de esa fecha */}
              <div className="space-y-4">
                {group.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-sm lg:max-w-lg px-4 py-3 rounded-2xl ${
                        message.type === "user"
                          ? "bg-zinc-800 text-white border border-zinc-700"
                          : "bg-zinc-900 text-white border border-zinc-700"
                      }`}
                    >
                      {message.isAudio ? (
                        <div className="flex items-center gap-3 py-1 w-full">
                          <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <Volume2 className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <AudioWaveform isPlaying={isPlaying} duration={message.duration} />
                          </div>
                          <Button
                            onClick={() => isPlaying ? pauseAudio() : playAudio(message.audioUrl!)}
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0 bg-zinc-700 hover:bg-zinc-600 flex-shrink-0"
                          >
                            {isPlaying ? (
                              <Pause className="w-3 h-3 text-white" />
                            ) : (
                              <Play className="w-3 h-3 text-white" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          {message.type === "system" && (
                            <div className="mt-1">
                              {getMessageTypeIcon(message.messageType)}
                            </div>
                          )}
                          <p className="text-sm text-white">{message.content}</p>
                        </div>
                      )}
                      <p className="text-xs mt-2 text-zinc-400">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="px-4 py-2 bg-red-900/20 border-t border-red-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-400">Grabando...</span>
              </div>
              <span className="text-sm text-red-400 font-mono">
                {formatDuration(recordingDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          {!idCumplido ? (
            <div className="text-center py-4">
              <p className="text-zinc-500 text-sm">Selecciona un turno para poder enviar mensajes</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu reporte de comunicación..."
                  className="pl-10 pr-4 py-3 resize-none bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 focus:border-zinc-600 focus:ring-zinc-600"
                  rows={1}
                />
              </div>
              
              {/* Botón de envío */}
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || sending}
                className="w-12 h-12 rounded-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </Button>
              
              {/* Botón de grabación */}
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={sending}
                className={`w-12 h-12 rounded-full ${
                  isRecording 
                    ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                    : "bg-zinc-700 hover:bg-zinc-600"
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
