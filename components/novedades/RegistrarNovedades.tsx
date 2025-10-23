'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import { uploadImage } from '@/lib/upload-image'

const formSchema = z.object({
  fecha: z.date(),
  hora: z.string().min(1, "La hora es requerida"), 
  tipo_reporte: z.string().min(1, "El tipo de reporte es requerido"),
  tipo_evento: z.string().min(1, "El tipo de evento es requerido"),
  negocio: z.string().min(1, "El negocio es requerido"),
  unidad_negocio: z.string().min(1, "La unidad de negocio es requerida"),
  puesto: z.string().min(1, "El puesto es requerido"),
  gestion: z.string().min(10, "La gestión debe tener al menos 10 caracteres"),
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  evento_critico: z.boolean(),
  imagenes: z.any().optional(),
})

interface UnidadNegocio {
  id_unidad_negocio: number | string
  nombre_puesto: string
  [key: string]: any
}

export default function RegistrarNovedades() {
  const [loading, setLoading] = useState(false)
  const [tiposReporte, setTiposReporte] = useState([])
  const [tiposEvento, setTiposEvento] = useState([])
  const [negocios, setNegocios] = useState([])
  const [unidadesNegocio, setUnidadesNegocio] = useState<UnidadNegocio[]>([])
  const [puestos, setPuestos] = useState([])
  const [imagenesPreview, setImagenesPreview] = useState<string[]>([])
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha: undefined as any,
      hora: "", 
      tipo_reporte: "",
      tipo_evento: "",
      negocio: "",
      unidad_negocio: "",
      puesto: "",
      gestion: "",
      descripcion: "",
      evento_critico: false,
      imagenes: undefined,
    },
  })

  const tipoReporteSeleccionado = form.watch("tipo_reporte")
  const negocioSeleccionado = form.watch("negocio")
  const unidadNegocioSeleccionada = form.watch("unidad_negocio")
  const puestoSeleccionado = form.watch("puesto")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tiposReporteRes, negociosRes] = await Promise.all([
          fetch("/api/novedades/tipos-reporte"),
          fetch("/api/negocios"),
        ])
        
        if (!tiposReporteRes.ok || !negociosRes.ok) {
          throw new Error("Error al cargar los datos")
        }

        const [tiposReporteData, negociosData] = await Promise.all([
          tiposReporteRes.json(),
          negociosRes.json(),
        ])

        setTiposReporte(tiposReporteData)
        setNegocios(negociosData)
        console.log('Negocios cargados para selector:', negociosData)
      } catch (error) {
        console.error("Error cargando datos:", error)
        toast.error("No se pudieron cargar los datos iniciales")
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchTiposEvento = async () => {
      if (!tipoReporteSeleccionado) {
        setTiposEvento([])
        form.setValue("tipo_evento", "")
        return
      }
      try {
        const response = await fetch(`/api/novedades/tipos-evento?tipoReporteId=${tipoReporteSeleccionado}`)
        if (!response.ok) {
          throw new Error("Error al cargar tipos de evento")
        }
        const data = await response.json()
        setTiposEvento(data)
        form.setValue("tipo_evento", "")
      } catch (error) {
        console.error("Error cargando tipos de evento:", error)
        toast.error("No se pudieron cargar los tipos de evento")
      }
    }
    fetchTiposEvento()
  }, [tipoReporteSeleccionado, form])

  useEffect(() => {
    const fetchUnidadesNegocio = async () => {
      if (!negocioSeleccionado) {
        setUnidadesNegocio([])
        form.setValue("unidad_negocio", "")
        return
      }
      try {
        const response = await fetch(`/api/novedades/unidades-negocio?id_negocio=${negocioSeleccionado}`)
        if (!response.ok) {
          throw new Error("Error al cargar unidades de negocio")
        }
        const data = await response.json()
        setUnidadesNegocio(data)
        form.setValue("unidad_negocio", "")
      } catch (error) {
        console.error("Error cargando unidades de negocio:", error)
        toast.error("No se pudieron cargar las unidades de negocio")
      }
    }
    fetchUnidadesNegocio()
  }, [negocioSeleccionado, form])

  useEffect(() => {
    const fetchPuestos = async () => {
      if (!unidadNegocioSeleccionada) {
        setPuestos([])
        form.setValue("puesto", "")
        return
      }
      try {
        const response = await fetch(`/api/novedades/puestos?id_unidad=${unidadNegocioSeleccionada}`)
        if (!response.ok) {
          throw new Error("Error al cargar puestos")
        }
        const data = await response.json()
        setPuestos(data)
        form.setValue("puesto", "")
      } catch (error) {
        console.error("Error cargando puestos:", error)
        toast.error("No se pudieron cargar los puestos")
      }
    }
    fetchPuestos()
  }, [unidadNegocioSeleccionada, form])

  useEffect(() => {
    if (unidadNegocioSeleccionada) {
      const unidadNegocio = unidadesNegocio.find((s) => s.id_unidad_negocio.toString() === unidadNegocioSeleccionada)
      if (unidadNegocio) {
        form.setValue("puesto", unidadNegocio.nombre_puesto || "")
      }
    } else {
      form.setValue("puesto", "")
    }
  }, [unidadNegocioSeleccionada, unidadesNegocio, form])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === files.length) {
          setImagenesPreview(newPreviews)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)
      
      // Obtener el ID del usuario de la sesión
      const userResponse = await fetch("/api/auth/me", {
        credentials: "include",
      })
      
      if (!userResponse.ok) {
        throw new Error("No se pudo obtener la información del usuario")
      }
      
      const userData = await userResponse.json()
      
      if (!userData?.id) {
        throw new Error("Usuario no autenticado")
      }
      
      const formattedData = {
        ...data,
        fecha: data.fecha ? format(data.fecha, "yyyy-MM-dd") : null,
        id_usuario: userData.id
      }

      console.log("Datos del formulario antes de procesar:", formattedData)

      const imagenesUrls: string[] = []
      if (data.imagenes && data.imagenes.length > 0) {
        try {
          const imagenesPromises = Array.from(data.imagenes as FileList).map(async (file: File) => {
            try {
              const url = await uploadImage(file) // Subida real genérica
              return url
            } catch (error) {
              console.error("Error al subir imagen:", error)
              throw new Error(`Error al subir la imagen ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
          })
          const urls = await Promise.all(imagenesPromises)
          imagenesUrls.push(...urls)
        } catch (error) {
          console.error("Error procesando imágenes:", error)
          throw new Error("Hubo un error al procesar las imágenes. Por favor, intente nuevamente.")
        }
      }

      const dataToSend = {
        ...formattedData,
        imagenes: imagenesUrls,
      }

      console.log("Datos a enviar:", dataToSend)

      const response = await fetch('/api/novedades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        const responseData = await response.json()
        console.error('Error del servidor:', responseData)
        throw new Error(responseData.error || 'Error al registrar la novedad')
      }

      const responseData = await response.json()

      toast.success("La novedad ha sido registrada exitosamente.")

      form.reset()
      setImagenesPreview([])
      router.refresh()
      
      // Redirigir al historial de novedades
      router.push('/novedades/historial')
    } catch (error) {
      console.error('Error al registrar novedad:', error)
      toast.error(error instanceof Error ? error.message : "Error al registrar la novedad. Por favor, intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="max-w-4xl mx-auto space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel className="text-gray-900 font-medium">Fecha de la Novedad</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                  "w-full pl-3 text-left font-normal bg-white",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { locale: es })
                              ) : (
                                <span>Seleccione una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hora"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Hora de la Novedad</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Select
                            value={field.value?.split(":")[0] || ""}
                              onValueChange={(value) =>
                                field.onChange(`${value}:${field.value?.split(":")[1] || "00"}`)
                              }
                          >
                              <SelectTrigger className="w-20 bg-white">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((h) => (
                                  <SelectItem key={h} value={h}>
                                    {h}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span>:</span>
                          <Select
                            value={field.value?.split(":")[1] || ""}
                              onValueChange={(value) =>
                                field.onChange(`${field.value?.split(":")[0] || "00"}:${value}`)
                              }
                          >
                              <SelectTrigger className="w-20 bg-white">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")).map((m) => (
                                  <SelectItem key={m} value={m}>
                                    {m}
                                  </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                  />
                </div>
 

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tipo_reporte"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Tipo de Reporte</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value)
                            form.setValue("tipo_evento", "")
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Seleccione tipo de reporte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tiposReporte.map((tipo: any) => (
                              <SelectItem key={tipo.id_tipo_reporte} value={tipo.id_tipo_reporte.toString()}>
                                {tipo.nombre_tipo_reporte}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo_evento"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Tipo de Evento</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value} 
                          disabled={!tipoReporteSeleccionado}
                        >
                        <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue
                                placeholder={
                                  tipoReporteSeleccionado
                                    ? "Seleccione tipo de evento"
                                    : "Primero seleccione tipo de reporte"
                                }
                              />
                          </SelectTrigger>
                        </FormControl>
                          <SelectContent>
                            {tiposEvento.map((tipo: any) => (
                              <SelectItem key={tipo.id_tipo_evento} value={tipo.id_tipo_evento.toString()}>
                                {tipo.nombre_tipo_evento}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="negocio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Negocio</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value)
                            form.setValue("unidad_negocio", "")
                            form.setValue("puesto", "")
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Seleccione negocio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {negocios.map((negocio: any) => (
                              <SelectItem key={negocio.id_negocio} value={negocio.id_negocio.toString()}>
                                {negocio.nombre_negocio}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unidad_negocio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Unidad de Negocio</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value)
                            form.setValue("puesto", "")
                          }} 
                          value={field.value}
                          disabled={!negocioSeleccionado}
                        >
                        <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue
                                placeholder={
                                  negocioSeleccionado
                                    ? "Seleccione unidad de negocio"
                                    : "Primero seleccione negocio"
                                }
                              />
                            </SelectTrigger>
                        </FormControl>
                          <SelectContent>
                            {unidadesNegocio.map((unidad: any) => (
                              <SelectItem key={unidad.id_unidad_negocio} value={unidad.id_unidad_negocio.toString()}>
                                {unidad.nombre_unidad_negocio}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="puesto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Puesto</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={puestos.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder={
                                puestos.length > 0
                                  ? "Seleccione puesto"
                                  : "Primero seleccione unidad de negocio"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {puestos.map((puesto: any) => (
                              <SelectItem key={puesto.id_puesto} value={puesto.id_puesto.toString()}>
                                {puesto.nombre_puesto}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Descripción de la Novedad</FormLabel>
                      <FormControl>
                        <Textarea 
                            placeholder="Describa la novedad en detalle"
                          {...field} 
                            className="min-h-[120px] resize-y bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gestion"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Gestión</FormLabel>
                      <FormControl>
                        <Textarea 
                            placeholder="Describa la gestión realizada"
                          {...field} 
                            className="min-h-[120px] resize-y bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imagenes"
                    render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                        <FormLabel className="text-gray-900 font-medium">Adjuntar Fotos</FormLabel>
                      <FormControl>
                          <div className="space-y-4">
                        <Input 
                          type="file" 
                          multiple 
                          accept="image/*"
                              onChange={(e) => {
                                onChange(e.target.files)
                                handleImageChange(e)
                              }}
                              {...field}
                              className="bg-white"
                            />

                            {imagenesPreview.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                                {imagenesPreview.map((src, index) => (
                                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                                    <img
                                      src={src || "/placeholder.svg"}
                                      alt={`Vista previa ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evento_critico"
                    render={({ field }) => (
                    <FormItem className="flex items-center space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                        <FormLabel className="font-normal text-gray-900">Marcar como evento crítico</FormLabel>
                    </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t p-4">
            <div className="max-w-4xl mx-auto">
              <Button 
                type="submit" 
                disabled={loading} 
            className="w-full bg-[#004e89] hover:bg-[#004e89]/90 text-white"
            onClick={form.handleSubmit(onSubmit)}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registrando novedad...</span>
                  </div>
            ) : (
              "Registrar Novedad"
            )}
              </Button>
            </div>
          </div>
    </div>
  )
}