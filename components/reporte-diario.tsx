"use client"

import type * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import Skeleton from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Settings, Sun, Moon, Timer, Download } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import ModalConfirmacion from "@/components/modal-confirmacion"
import ConfiguracionesReportesModal from "@/components/configuraciones-reportes-modal"

interface Cumplido {
  id_cumplido: number
  fecha: string
  id_puesto: number
  id_tipo_turno: number
  colaborador_diurno: string
  colaborador_nocturno: string
  calificaciones: { [key: string]: number }
  notas?: { [key: string]: string }
  colaborador?: string
}

interface Configuracion {
  id: number
  fecha_inicial: string
  cantidad_diurno: number
  cantidad_nocturno: number
  id_negocio: number
}

interface CumplidoNegocioTableProps {
  negocioId: number
  negocioNombre: string
}

interface DateState {
  anio: string
  mes: string
  dia: string
}

interface ModalState {
  type: "config" | "nota" | null
  open: boolean
  config?: {
    id?: number
    fecha_inicial?: string
    cantidad_diurno?: number
    cantidad_nocturno?: number
    idCumplido?: number
    idPuesto?: number
    tipo?: "diurno" | "nocturno"
    hora?: string
    nota?: string
  }
}

interface PendingChange {
  idPuesto: number
  colaborador_diurno?: string
  colaborador_nocturno?: string
  calificaciones?: { [key: string]: any }
}

interface Puesto {
  id_puesto: number
  nombre_puesto: string
  nombre_unidad: string
  id_unidad: number
  activo: boolean
  fecha_inicial?: string
}

// Estado para el filtro de turno (debe estar fuera del componente)
const getDefaultTurnoFiltro = () => {
  const now = new Date()
  const hour = now.getHours()
  if (hour >= 6 && hour < 18) return "diurno"
  return "nocturno"
}

// Función para determinar el turno según la hora
function getTurnoByHora(hora: string) {
  if (!hora) return "diurno"
  const [hh, mm] = hora.split(":").map(Number)
  const minutos = hh * 60 + mm
  if (minutos >= 360 && minutos < 840) return "diurno" // 06:00 - 13:59
  if (minutos >= 840 && minutos < 1320) return "b" // 14:00 - 21:59
  // Nocturno: 22:00 - 23:59 (1320-1439) o 00:00 - 05:59 (0-359)
  if (minutos >= 1320 || minutos < 360) return "nocturno"
  return "diurno" // fallback
}

export function CumplidoNegocioTable({ negocioId, negocioNombre }: CumplidoNegocioTableProps) {
  const [date, setDate] = useState<DateState>({
    anio: new Date().getFullYear().toString(),
    mes: (new Date().getMonth() + 1).toString().padStart(2, "0"),
    dia: new Date().getDate().toString().padStart(2, "0"),
  })
  const [cumplidos, setCumplidos] = useState<Record<number, { diurno?: Cumplido; b?: Cumplido; nocturno?: Cumplido }>>(
    {},
  )
  const [loading, setLoading] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Map<number, PendingChange>>(new Map())
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([])
  const [modal, setModal] = useState<ModalState>({ type: null, open: false })
  const [saving, setSaving] = useState<Set<number>>(new Set())
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [editMode, setEditMode] = useState(false)
  const [horasColumnas, setHorasColumnas] = useState<{ [key: string]: string }>({})
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; colKey: string | null }>({
    visible: false,
    x: 0,
    y: 0,
    colKey: null,
  })
  const [notaDialog, setNotaDialog] = useState<{
    open: boolean
    idPuesto: number | null
    colKey: string | null
    nota: string
  }>({ open: false, idPuesto: null, colKey: null, nota: "" })
  const [horasEditadas, setHorasEditadas] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null)
  const [turnoFiltro, setTurnoFiltro] = useState<"diurno" | "nocturno" | "b" | "24h">(getDefaultTurnoFiltro() as any)
  const [excelMenuOpen, setExcelMenuOpen] = useState(false)
  const [excelDialogOpen, setExcelDialogOpen] = useState(false)
  const [excelDesdeAnio, setExcelDesdeAnio] = useState(date.anio)
  const [excelDesdeMes, setExcelDesdeMes] = useState(date.mes)
  const [excelDesdeDia, setExcelDesdeDia] = useState(date.dia)
  const [excelHastaAnio, setExcelHastaAnio] = useState(date.anio)
  const [excelHastaMes, setExcelHastaMes] = useState(date.mes)
  const [excelHastaDia, setExcelHastaDia] = useState(date.dia)

  const cargarConfiguraciones = useCallback(async () => {
    try {
      const response = await fetch(`/api/reporte-comunicacion/configuraciones?negocioId=${negocioId}`)
      if (!response.ok) throw new Error("Error al cargar configuraciones")
      const data: Configuracion[] = await response.json()
      setConfiguraciones(data.sort((a, b) => new Date(a.fecha_inicial).getTime() - new Date(b.fecha_inicial).getTime()))
    } catch (error) {
      console.error("Error:", error)
      setErrorDialog({ open: true, message: "Error al cargar configuraciones" })
    }
  }, [negocioId])

  const getApplicableConfig = (fecha: Date): { cantidad_diurno: number; cantidad_nocturno: number } => {
    const config = [...configuraciones]
      .filter((c) => new Date(c.fecha_inicial) <= fecha)
      .sort((a, b) => new Date(b.fecha_inicial).getTime() - new Date(a.fecha_inicial).getTime())[0]
    return {
      cantidad_diurno: config?.cantidad_diurno || 0,
      cantidad_nocturno: config?.cantidad_nocturno || 0,
    }
  }

  const cargarCumplidos = useCallback(async () => {
    if (!date.mes || !date.dia) return
    setLoading(true)
    try {
      const fecha = new Date(Number.parseInt(date.anio), Number.parseInt(date.mes) - 1, Number.parseInt(date.dia))
      const fechaStr = fecha.toISOString().slice(0, 10) // 'YYYY-MM-DD'
      const responseReportes = await fetch(`/api/reporte-comunicacion?negocioId=${negocioId}&fecha=${fechaStr}`)
      if (!responseReportes.ok) throw new Error("Error al cargar los reportes de comunicación")
      const reportes: {
        id_cumplido: number
        id_puesto: number
        id_tipo_turno: number
        colaborador?: string
        colaborador_diurno?: string
        colaborador_nocturno?: string
        fecha: string
        notas?: { [key: string]: string }
        calificaciones: any
      }[] = await responseReportes.json()

      const grouped: Record<number, { diurno?: Cumplido; b?: Cumplido; nocturno?: Cumplido }> = {}
      const nuevasHorasColumnas: { [key: string]: string } = {}

      reportes.forEach((reporte) => {
        const calificaciones: { [key: string]: any } = {}
        if (reporte.calificaciones && typeof reporte.calificaciones === "object") {
          Object.entries(reporte.calificaciones).forEach(([rKey, horaObj]) => {
            if (horaObj && typeof horaObj === "object") {
              Object.entries(horaObj).forEach(([hora, valor]) => {
                if (!calificaciones[rKey]) calificaciones[rKey] = {}
                calificaciones[rKey][hora] = valor
                nuevasHorasColumnas[rKey] = hora
              })
            }
          })
        }

        // Determinar el tipo de turno del reporte
        let tipoTurno: "diurno" | "b" | "nocturno" = "diurno"
        if (reporte.id_tipo_turno === 2) tipoTurno = "nocturno"
        else if (reporte.id_tipo_turno === 3) tipoTurno = "b"

        if (!grouped[reporte.id_puesto]) grouped[reporte.id_puesto] = {}
        grouped[reporte.id_puesto][tipoTurno] = {
          id_cumplido: reporte.id_cumplido,
          fecha: reporte.fecha,
          id_puesto: reporte.id_puesto,
          id_tipo_turno: reporte.id_tipo_turno,
          colaborador: reporte.colaborador ?? "",
          colaborador_diurno: reporte.colaborador_diurno ?? "",
          colaborador_nocturno: reporte.colaborador_nocturno ?? "",
          calificaciones,
          notas: reporte.notas || {},
        }
      })

      if (Object.keys(nuevasHorasColumnas).length > 0) {
        setHorasColumnas((prev) => ({ ...prev, ...nuevasHorasColumnas }))
      } else {
        setHorasColumnas({})
      }

      setCumplidos(grouped)
    } catch (error) {
      console.error("Error:", error)
      setErrorDialog({ open: true, message: "Error al cargar los reportes de comunicación" })
    } finally {
      setLoading(false)
    }
  }, [date, negocioId])

  const cargarPuestos = useCallback(async () => {
    try {
      const response = await fetch(`/api/configuracion-puestos?negocioId=${negocioId}`)
      if (!response.ok) throw new Error("Error al cargar los puestos")
      const data = await response.json()
      setPuestos(data)
    } catch (error) {
      console.error("Error:", error)
      setErrorDialog({ open: true, message: "Error al cargar los puestos" })
    }
  }, [negocioId])

  const fechaSeleccionada = new Date(
    Number.parseInt(date.anio),
    Number.parseInt(date.mes) - 1,
    Number.parseInt(date.dia),
  )
  const { cantidad_diurno, cantidad_nocturno, cantidad_turno_b } = getApplicableConfig(fechaSeleccionada) as any
  const horas: { key: string; label: string; tipo: "diurno" | "b" | "nocturno" }[] = [
    ...Array.from({ length: cantidad_diurno || 0 }, (_, i) => ({
      key: `R${i + 1}`,
      label: `R${i + 1} (Diurno)`,
      tipo: "diurno" as const,
    })),
    ...Array.from({ length: cantidad_turno_b || 0 }, (_, i) => ({
      key: `R${cantidad_diurno + i + 1}`,
      label: `R${cantidad_diurno + i + 1} (Turno B)`,
      tipo: "b" as const,
    })),
    ...Array.from({ length: cantidad_nocturno || 0 }, (_, i) => ({
      key: `R${cantidad_diurno + (cantidad_turno_b || 0) + i + 1}`,
      label: `R${cantidad_diurno + (cantidad_turno_b || 0) + i + 1} (Nocturno)`,
      tipo: "nocturno" as const,
    })),
  ]

  const horasFiltradas = horas.filter((h) => {
    if (turnoFiltro === "24h") return true
    if (turnoFiltro === "b") return h.tipo === "b"
    return h.tipo === turnoFiltro
  })

  useEffect(() => {
    setHorasColumnas((prev) => {
      const nuevasHoras: { [key: string]: string } = {}
      horasFiltradas.forEach(({ key }) => {
        nuevasHoras[key] = (prev && typeof prev === "object" ? prev[key] : "") || ""
      })
      return nuevasHoras
    })
  }, [cantidad_diurno, cantidad_nocturno])

  const handleEdit = () => {
    setEditMode(true)
  }

  const saveBatch = useCallback(
    async (changes: PendingChange[], horasCol: { [key: string]: string }) => {
    setSaving((prev) => {
        const newSet = new Set(prev)
        changes.forEach((change) => newSet.add(change.idPuesto))
        return newSet
      })

      try {
        const fecha = new Date(
          Number.parseInt(date.anio),
          Number.parseInt(date.mes) - 1,
          Number.parseInt(date.dia),
        ).toISOString()
        const payloads: {
          id_cumplido: number
          calificaciones: Record<string, Record<string, { valor: number | null; nota: string | null }>>
        }[] = []

        // Verificar si existe turno B para cada puesto
      for (const change of changes) {
          const cumplido = cumplidos[change.idPuesto]
          const existeTurnoB = cumplido?.b !== undefined

          console.log(`Puesto ${change.idPuesto}: ¿Existe turno B?`, existeTurnoB)

          // Reagrupar calificaciones por turno según la hora
          const calificacionesPorTurno: {
            diurno: Record<string, Record<string, { valor: number | null; nota: string | null }>>
            b: Record<string, Record<string, { valor: number | null; nota: string | null }>>
            nocturno: Record<string, Record<string, { valor: number | null; nota: string | null }>>
          } = { diurno: {}, b: {}, nocturno: {} }

          Object.entries(change.calificaciones || {}).forEach(([rKey, horasObj]) => {
            if (horasObj && typeof horasObj === "object") {
              Object.entries(horasObj).forEach(([hora, val]) => {
                let turnoDestino: "diurno" | "b" | "nocturno"

                if (existeTurnoB) {
                  // Si existe turno B, usar la lógica de horas
                  turnoDestino = getTurnoByHora(hora)
              } else {
                  // Si no existe turno B, determinar por la hora
                  const turnoHora = getTurnoByHora(hora)
                  turnoDestino = turnoHora === "b" ? "diurno" : turnoHora // Si no hay turno B, convertir B a diurno
                }

                if (!calificacionesPorTurno[turnoDestino][rKey]) {
                  calificacionesPorTurno[turnoDestino][rKey] = {}
                }
                calificacionesPorTurno[turnoDestino][rKey][hora] = val as { valor: number | null; nota: string | null }
              })
            }
          })

          // Crear payloads para cada turno que tenga calificaciones
          if (cumplido?.diurno && Object.keys(calificacionesPorTurno.diurno).length > 0) {
            payloads.push({
              id_cumplido: cumplido.diurno.id_cumplido,
              calificaciones: calificacionesPorTurno.diurno,
            })
          }

          if (cumplido?.b && Object.keys(calificacionesPorTurno.b).length > 0) {
            payloads.push({
              id_cumplido: cumplido.b.id_cumplido,
              calificaciones: calificacionesPorTurno.b,
            })
          }

          if (cumplido?.nocturno && Object.keys(calificacionesPorTurno.nocturno).length > 0) {
            payloads.push({
              id_cumplido: cumplido.nocturno.id_cumplido,
              calificaciones: calificacionesPorTurno.nocturno,
            })
          }
        }

        // DEPURACIÓN: Mostrar payloads como texto plano
        let payloadDebug = "\n========= PAYLOADS A ENVIAR AL BACKEND =========\n"
        payloads.forEach((item) => {
          let puesto = null,
            turno = ""
          for (const [idPuesto, turnos] of Object.entries(cumplidos)) {
            for (const [tipo, cumplido] of Object.entries(turnos)) {
              if (cumplido && cumplido.id_cumplido === item.id_cumplido) {
                puesto = puestos.find((p) => p.id_puesto === Number(idPuesto))
                if (tipo === "diurno") turno = "DIURNO"
                else if (tipo === "b") turno = "TURNO B"
                else if (tipo === "nocturno") turno = "NOCTURNO"
              }
            }
          }
          payloadDebug += `\nPUESTO: ${puesto ? puesto.nombre_puesto : "??"} | TURNO: ${turno} | id_cumplido: ${item.id_cumplido}\n`
          if (item.calificaciones && Object.keys(item.calificaciones).length > 0) {
            Object.entries(item.calificaciones).forEach(([rKey, horasObj]) => {
              if (horasObj && typeof horasObj === "object" && !Array.isArray(horasObj)) {
                Object.entries(horasObj).forEach(([hora, val]) => {
                  const valor = typeof val === "object" && val !== null && "valor" in val ? val.valor : val
                  const turnoHora = getTurnoByHora(hora)
                  payloadDebug += `    ${rKey}: ${hora} (${turnoHora}) >: ${valor}\n`
                })
              }
            })
          } else {
            payloadDebug += "    SIN CALIFICACIONES\n"
          }
        })
        payloadDebug += "=====================================\n"
        console.log(payloadDebug)

        await Promise.all(
          payloads.map(async (item) => {
            const res = await fetch("/api/reporte-comunicacion/guardar-reporte", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
            })
            if (!res.ok) throw new Error("Error al guardar el reporte de comunicación")
          }),
        )

      setPendingChanges((prev) => {
          const newMap = new Map(prev)
          changes.forEach((change) => newMap.delete(change.idPuesto))
          return newMap
        })

        await cargarCumplidos()
    } catch (error) {
        console.error("Error:", error)
        setErrorDialog({ open: true, message: "Error al guardar los cambios" })
    } finally {
      setSaving((prev) => {
          const newSet = new Set(prev)
          changes.forEach((change) => newSet.delete(change.idPuesto))
          return newSet
        })
      }
    },
    [date, cargarCumplidos, cumplidos, puestos],
  )

  const handleSaveAll = useCallback(async () => {
    if (pendingChanges.size === 0 && !horasEditadas) return
    await saveBatch(Array.from(pendingChanges.values()), horasColumnas)
    setEditMode(false)
    setHorasEditadas(false)
  }, [pendingChanges, saveBatch, horasColumnas, horasEditadas])

  const handleChange = useCallback(
    (idPuesto: number, field: string, value: number) => {
      setPendingChanges((prev) => {
        const newMap = new Map(prev)
        const existing = newMap.get(idPuesto) || {
          idPuesto,
          calificaciones: {
            ...cumplidos[idPuesto]?.diurno?.calificaciones,
            ...cumplidos[idPuesto]?.b?.calificaciones,
            ...cumplidos[idPuesto]?.nocturno?.calificaciones,
          },
        }

        const calificaciones = existing.calificaciones || {}
        if (field.startsWith("calificaciones.")) {
          const [, key] = field.split(".")
          const hora = horasColumnas[key] || ""

          let nota: string | null = null
          const prevValor = calificaciones[key]
          if (prevValor && typeof prevValor === "object" && "nota" in prevValor) {
            nota = (prevValor as any).nota
          }

          // Siempre guardar el valor (incluyendo 0)
          if (!calificaciones[key]) {
            calificaciones[key] = {}
          }
          calificaciones[key][hora] = { valor: value, nota }

          newMap.set(idPuesto, {
            ...existing,
            calificaciones: {
              ...calificaciones,
            },
          })
        } else {
          if (typeof value === "string") {
            newMap.set(idPuesto, { ...existing, [field]: value })
          }
        }
        return newMap
      })
    },
    [cumplidos, horasColumnas],
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, idPuesto: number, tipo: "diurno" | "nocturno", hora: string) => {
      e.preventDefault()
      const cumplido = cumplidos[idPuesto]
      const nota = (tipo === "diurno" ? cumplido?.diurno?.notas?.[hora] : cumplido?.nocturno?.notas?.[hora]) || ""
      setModal({
        type: "nota",
        open: true,
        config: {
          idCumplido: cumplido?.diurno?.id_cumplido || cumplido?.nocturno?.id_cumplido,
          idPuesto,
          tipo,
          hora,
          nota,
        },
      })
    },
    [cumplidos],
  )

  const guardarNota = useCallback(async () => {
    if (!modal.config?.idPuesto || !modal.config.hora) return
    try {
      const fecha = new Date(Number.parseInt(date.anio), Number.parseInt(date.mes) - 1, Number.parseInt(date.dia))
      let idCumplido =
        cumplidos[modal.config.idPuesto]?.diurno?.id_cumplido || cumplidos[modal.config.idPuesto]?.nocturno?.id_cumplido
      if (!idCumplido) {
        const response = await fetch("/api/cumplidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_puesto: modal.config.idPuesto,
            fecha: fecha.toISOString(),
            id_tipo_turno: modal.config.tipo === "diurno" ? 1 : 2,
            colaborador_diurno: "",
            colaborador_nocturno: "",
            calificaciones: {},
          }),
        })
        const data = await response.json()
        idCumplido = data.id_cumplido
      }

      const response = await fetch("/api/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCumplido,
          hora: modal.config.hora,
          nota: modal.config.nota,
        }),
      })

      if (!response.ok) throw new Error("Error al guardar la nota")

      if (!idCumplido) return

      setCumplidos((prev) => {
        if (!modal.config) return prev
        const newCumplidos = { ...prev }
        if (modal.config?.tipo === "diurno") {
          if (modal.config?.idPuesto && newCumplidos[modal.config.idPuesto]?.diurno) {
            newCumplidos[modal.config.idPuesto].diurno = {
              ...newCumplidos[modal.config.idPuesto].diurno!,
              notas: {
                ...newCumplidos[modal.config.idPuesto].diurno?.notas,
                ...(modal.config?.hora ? { [modal.config.hora]: modal.config.nota || "" } : {}),
              },
            }
          }
        } else {
          if (modal.config?.idPuesto && newCumplidos[modal.config.idPuesto]?.nocturno) {
            newCumplidos[modal.config.idPuesto].nocturno = {
              ...newCumplidos[modal.config.idPuesto].nocturno!,
              notas: {
                ...newCumplidos[modal.config.idPuesto].nocturno?.notas,
                ...(modal.config?.hora ? { [modal.config.hora]: modal.config.nota || "" } : {}),
              },
            }
          }
        }
        return newCumplidos
      })

      setModal({ type: null, open: false })
      await cargarCumplidos()
    } catch (error) {
      console.error("Error:", error)
      setErrorDialog({ open: true, message: "Error al guardar la nota" })
    }
  }, [modal, date, cumplidos, cargarCumplidos])

  const guardarConfiguracion = useCallback(async () => {
    if (
      !modal.config?.fecha_inicial ||
      modal.config.cantidad_diurno === undefined ||
      modal.config.cantidad_nocturno === undefined
    )
      return
    try {
      const response = await fetch("/api/reporte-comunicacion/configuraciones", {
        method: modal.config.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modal.config.id,
          fecha_inicial: modal.config.fecha_inicial,
          cantidad_diurno: modal.config.cantidad_diurno,
          cantidad_nocturno: modal.config.cantidad_nocturno,
          id_negocio: negocioId,
        }),
      })
      if (!response.ok) throw new Error("Error al guardar la configuración")
      setModal({ type: null, open: false })
      await cargarConfiguraciones()
    } catch (error) {
      console.error("Error:", error)
      setErrorDialog({ open: true, message: "Error al guardar la configuración" })
    }
  }, [modal, negocioId, cargarConfiguraciones])

  const handleAutocompletarColumna = (colKey: string) => {
    setPendingChanges((prev) => {
      const newMap = new Map(prev)
      puestos.forEach((puesto) => {
        const esDiurno = colKey.endsWith("_diurno")
        const esTurnoB = colKey.endsWith("_b")
        const esNocturno = colKey.endsWith("_nocturno")
        const cumplidoDiurno = cumplidos[puesto.id_puesto]?.diurno
        const cumplidoNocturno = cumplidos[puesto.id_puesto]?.nocturno
        const cumplidoTurnoB = cumplidos[puesto.id_puesto]?.b

        const nombreColaborador = esDiurno
          ? cumplidoDiurno?.colaborador_diurno || cumplidoDiurno?.colaborador || ""
          : esTurnoB
            ? cumplidoTurnoB?.colaborador || ""
            : cumplidoNocturno?.colaborador_nocturno || cumplidoNocturno?.colaborador || ""

        if (nombreColaborador.trim().toUpperCase() === "N/A") return

        const idPuesto = puesto.id_puesto
        const existing = newMap.get(idPuesto) || {
          idPuesto,
          calificaciones: {
            ...cumplidos[idPuesto]?.diurno?.calificaciones,
            ...cumplidos[idPuesto]?.b?.calificaciones,
            ...cumplidos[idPuesto]?.nocturno?.calificaciones,
          },
        }

        if (!existing.calificaciones) {
          existing.calificaciones = {};
        }
        const hora = horasColumnas[colKey] || '';
        if (!existing.calificaciones[colKey]) {
          existing.calificaciones[colKey] = {};
        }
        existing.calificaciones[colKey][hora] = { valor: 10, nota: null };

        newMap.set(idPuesto, existing)
      })
      return newMap
    })
    setContextMenu({ visible: false, x: 0, y: 0, colKey: null })
  }

  useEffect(() => {
    if (!contextMenu.visible) return
    const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, colKey: null })
    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
  }, [contextMenu.visible])

  useEffect(() => {
    cargarConfiguraciones()
    cargarPuestos()
    if (date.mes && date.dia) cargarCumplidos()
  }, [date, negocioId])

  const puestosFiltrados = puestos.filter((puesto) => {
    const fechaInicial = puesto.fecha_inicial ? new Date(puesto.fecha_inicial) : null
    const fechaValida = !fechaInicial || fechaSeleccionada >= fechaInicial
    return puesto.activo && fechaValida
  })

  const puestosOrdenados = [...puestosFiltrados].sort((a, b) => {
    const regex = /^([^\d]*?)(\d+)/
    const matchA = a.nombre_puesto.match(regex)
    const matchB = b.nombre_puesto.match(regex)
    if (matchA && matchB) {
      const prefixA = matchA[1].trim().toUpperCase()
      const prefixB = matchB[1].trim().toUpperCase()
      if (prefixA !== prefixB) {
        return prefixA.localeCompare(prefixB, "es", { numeric: true })
      }
      const numA = Number.parseInt(matchA[2], 10)
      const numB = Number.parseInt(matchB[2], 10)
      return numA - numB
    }
    return a.nombre_puesto.localeCompare(b.nombre_puesto, "es", { numeric: true })
  })

  const handleNotaContextMenu = (e: React.MouseEvent, idPuesto: number, colKey: string) => {
    e.preventDefault()
    let notaActual = ""
    const pending = pendingChanges.get(idPuesto)
    const hora = horasColumnas[colKey] || ""

    if (
      pending?.calificaciones?.[colKey]?.[hora] &&
      typeof pending.calificaciones[colKey][hora] === "object" &&
      "nota" in pending.calificaciones[colKey][hora]
    ) {
      notaActual = (pending.calificaciones[colKey][hora] as any).nota || ""
    } else {
      // Buscar en todas las calificaciones existentes
      const calDiurno = (cumplidos[idPuesto]?.diurno?.calificaciones as Record<string, any>)?.[colKey]?.[hora]
      const calB = (cumplidos[idPuesto]?.b?.calificaciones as Record<string, any>)?.[colKey]?.[hora]
      const calNocturno = (cumplidos[idPuesto]?.nocturno?.calificaciones as Record<string, any>)?.[colKey]?.[hora]

      const cal = calDiurno || calB || calNocturno
      if (cal && typeof cal === "object" && "nota" in cal) {
        notaActual = (cal as any).nota || ""
      }
    }
    setNotaDialog({ open: true, idPuesto, colKey, nota: notaActual })
  }

  const handleGuardarNota = () => {
    if (notaDialog.idPuesto == null || notaDialog.colKey == null) return
    const idPuesto = notaDialog.idPuesto
    const colKey = String(notaDialog.colKey)
    const hora = horasColumnas[colKey] || ""

    setPendingChanges((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(idPuesto) || {
        idPuesto,
        calificaciones: {
          ...cumplidos[idPuesto]?.diurno?.calificaciones,
          ...cumplidos[idPuesto]?.b?.calificaciones,
          ...cumplidos[idPuesto]?.nocturno?.calificaciones,
        },
      }

      const calificaciones = existing.calificaciones || {}
      if (!calificaciones[colKey]) {
        calificaciones[colKey] = {}
      }

      let valor = calificaciones[colKey][hora]
      if (valor && typeof valor === "object" && "valor" in valor) {
        valor = { ...(valor as any), nota: notaDialog.nota }
      } else {
        valor = { valor: valor ?? 0, nota: notaDialog.nota }
      }

      calificaciones[colKey][hora] = valor

      newMap.set(idPuesto, {
        ...existing,
        calificaciones,
      })
      return newMap
    })
    setNotaDialog({ open: false, idPuesto: null, colKey: null, nota: "" })
  }

  const intentarSalir = (accion: () => void) => {
    if (pendingChanges.size > 0 || horasEditadas) {
      setShowConfirmDialog(true)
      setPendingAction(() => accion)
    } else {
      accion()
    }
  }

  const handleChangeFecha = (campo: keyof DateState, valor: string) => {
    intentarSalir(() => setDate((prev) => ({ ...prev, [campo]: valor })))
  }

  const handleCancelEdit = () => {
    intentarSalir(() => setEditMode(false))
  }

  const handleConfirmSalir = () => {
    setShowConfirmDialog(false)
    setHorasEditadas(false)
    setPendingChanges(new Map())
    if (pendingAction) pendingAction()
    setPendingAction(null)
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.size > 0 || horasEditadas) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [pendingChanges, horasEditadas])

  const handleDescargarDiaActual = async () => {
    try {
      const fecha = `${date.anio}-${date.mes}-${date.dia}`
      const res = await fetch("/api/reporte-comunicacion/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          negocioId,
          tipo: "dia",
          fechaDia: fecha,
          nombreNegocio: negocioNombre,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "No se pudo descargar el archivo")
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${negocioNombre.replace(/\s+/g, "_")}_${fecha}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert("Error al descargar el archivo")
    }
  }

  const handleDescargarGlobal = async () => {
    try {
      const fechaInicio = `${excelDesdeAnio}-${excelDesdeMes.padStart(2, "0")}-${excelDesdeDia.padStart(2, "0")}`
      const fechaFin = `${excelHastaAnio}-${excelHastaMes.padStart(2, "0")}-${excelHastaDia.padStart(2, "0")}`
      const res = await fetch("/api/reporte-comunicacion/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          negocioId,
          tipo: "global",
          fechaInicio,
          fechaFin,
          nombreNegocio: negocioNombre,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        alert(error.error || "No se pudo descargar el archivo")
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${negocioNombre.replace(/\s+/g, "_")}_${fechaInicio}_a_${fechaFin}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setExcelDialogOpen(false)
    } catch (error) {
      alert("Error al descargar el archivo")
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto h-[90dvh] max-h-[90dvh] overflow-hidden">
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <CardTitle className="text-center">REPORTE DIARIO {negocioNombre}</CardTitle>
            <div className="flex items-center gap-2">
              {editMode ? (
                <Button
                  variant="outline"
                  onClick={handleSaveAll}
                  disabled={pendingChanges.size === 0 && !horasEditadas}
                >
                  Guardar
                </Button>
              ) : (
                <Button variant="outline" onClick={handleEdit}>
                  Empezar a Editar
                </Button>
              )}
              <DropdownMenu open={excelMenuOpen} onOpenChange={setExcelMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent" disabled={editMode}>
                    <Download size={18} /> Descargar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setExcelDialogOpen(true)
                      setExcelMenuOpen(false)
                    }}
                  >
                    Descargar Global
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      handleDescargarDiaActual()
                      setExcelMenuOpen(false)
                    }}
                  >
                    Descargar Día Actual
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => setModal({ type: "config", open: true })}>
                <Settings className="mr-2 h-4 w-4" /> Configurar Reportes
              </Button>
            </div>
          </div>
          <div className="flex flex-row gap-2 mt-4 w-full justify-start items-end">
            <div className="flex flex-col items-start w-20">
              <Label className="mb-1">Año</Label>
              <Select value={date.anio ?? ""} onValueChange={(value) => handleChangeFecha("anio", value)}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 13 }, (_, i) => ({
                    value: (new Date().getFullYear() + i).toString(),
                    label: (new Date().getFullYear() + i).toString(),
                  })).map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-start w-20">
              <Label className="mb-1">Mes</Label>
              <Select value={date.mes ?? ""} onValueChange={(value) => handleChangeFecha("mes", value)}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => ({
                    value: (i + 1).toString().padStart(2, "0"),
                    label: new Date(0, i).toLocaleString("es", { month: "long" }),
                  })).map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-start w-20">
              <Label className="mb-1">Día</Label>
              <Select value={date.dia ?? ""} onValueChange={(value) => handleChangeFecha("dia", value)}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Día" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => ({
                    value: (i + 1).toString().padStart(2, "0"),
                    label: (i + 1).toString(),
                  })).map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setTurnoFiltro("diurno")}
                className={`rounded-full p-2 shadow-md transition-colors ${turnoFiltro === "diurno" ? "bg-yellow-400 text-white scale-110" : "bg-gray-200 text-gray-700 hover:bg-yellow-200"} focus:outline-none`}
                title="Mostrar solo columnas diurnas"
                type="button"
              >
                <Sun size={22} />
              </button>
              <button
                onClick={() => setTurnoFiltro("nocturno")}
                className={`rounded-full p-2 shadow-md transition-colors ${turnoFiltro === "nocturno" ? "bg-blue-900 text-white scale-110" : "bg-gray-200 text-gray-700 hover:bg-blue-200"} focus:outline-none`}
                title="Mostrar solo columnas nocturnas"
                type="button"
              >
                <Moon size={22} />
              </button>
              <button
                onClick={() => setTurnoFiltro("24h")}
                className={`rounded-full p-2 shadow-md transition-colors ${turnoFiltro === "24h" ? "bg-green-600 text-white scale-110" : "bg-gray-200 text-gray-700 hover:bg-green-200"} focus:outline-none`}
                title="Mostrar todas las columnas"
                type="button"
              >
                <Timer size={22} />
              </button>
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 h-full w-full overflow-auto p-4" style={{ overflowX: "auto", overflowY: "auto" }}>
          <div style={{ minWidth: "fit-content", width: "100%" }}>
            <TooltipProvider>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="flex gap-2">
                      <Skeleton className="h-12 w-[200px]" />
                      <Skeleton className="h-12 w-[200px]" />
                      {Array(cantidad_diurno + cantidad_nocturno)
                        .fill(0)
                        .map((_, idx) => (
                          <Skeleton key={`skeleton-${i}-${idx}`} className="h-12 w-[100px]" />
                        ))}
                    </div>
                  ))}
                </div>
              ) : (
                <Table className="min-w-max w-full h-full" style={{ tableLayout: "auto" }}>
                  <TableHeader
                    className="sticky top-0 z-20"
                    style={{ position: "sticky", top: 0, background: "white" }}
                  >
                    <TableRow>
                      <TableHead className="w-[24px] sticky left-0 z-30 bg-white">Unidad de Negocio</TableHead>
                      <TableHead className="w-[200px] sticky left-[24px] z-30 bg-white">Puesto</TableHead>
                      {["diurno", "24h"].includes(turnoFiltro) && (
                        <TableHead className={`w-[200px] sticky left-[224px] z-30 bg-white`}>
                          Nombre Colaborador Diurno
                        </TableHead>
                      )}
                      {["b", "24h"].includes(turnoFiltro) && (
                        <TableHead
                          className={`w-[200px] sticky left-[${turnoFiltro === "24h" ? "424px" : "224px"}] z-30 bg-white`}
                        >
                          Nombre Colaborador Turno B
                        </TableHead>
                      )}
                      {["nocturno", "24h"].includes(turnoFiltro) && (
                        <TableHead
                          className={`w-[200px] sticky left-[${turnoFiltro === "24h" ? "624px" : "224px"}] z-30 bg-white`}
                        >
                          Nombre Colaborador Nocturno
                        </TableHead>
                      )}
                      {horasFiltradas.map((col, idx) => {
                        const n =
                          col.tipo === "diurno"
                            ? idx - horasFiltradas.findIndex((h) => h.tipo === "diurno") + 1
                            : idx - horasFiltradas.findIndex((h) => h.tipo === "nocturno") + 1
                        const sufijo = col.tipo === "diurno" ? "D" : col.tipo === "b" ? "B" : "N"
                        const hora = horasColumnas[col.key] || ""
                        return (
                          <TableHead
                            key={col.key}
                            className="w-[140px] text-center align-middle"
                            style={{ verticalAlign: "middle", textAlign: "center", padding: 0, position: "relative" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                              }}
                            >
                              <span
                                style={{ fontWeight: 600, cursor: editMode ? "context-menu" : "default" }}
                                onContextMenu={
                                  editMode
                                    ? (e) => {
                                        e.preventDefault()
                                        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, colKey: col.key })
                                      }
                                    : undefined
                                }
                              >{`R${n}.${sufijo}(${hora})`}</span>
                              {editMode && (
                                <div className="flex gap-2 mt-1">
                                  <Select
                                    value={hora.split(":")[0] || ""}
                                    onValueChange={(value) => {
                                      const minutos = hora.split(":")[1] || "00"
                                      const nuevaHora = `${value}:${minutos}`
                                      setHorasColumnas((h) => ({ ...h, [col.key]: nuevaHora }))
                                      setHorasEditadas(true)
                                      puestos.forEach((puesto) => {
                                        setPendingChanges((prev) => {
                                          const newMap = new Map(prev)
                                          const existing = newMap.get(puesto.id_puesto) || {
                                            idPuesto: puesto.id_puesto,
                                            calificaciones: {
                                              ...cumplidos[puesto.id_puesto]?.diurno?.calificaciones,
                                              ...cumplidos[puesto.id_puesto]?.b?.calificaciones,
                                              ...cumplidos[puesto.id_puesto]?.nocturno?.calificaciones,
                                            },
                                          }
                                          const calificaciones = { ...existing.calificaciones }
                                          const reporteKey = col.key
                                          if (calificaciones[reporteKey]) {
                                            const horasKeys = Object.keys(calificaciones[reporteKey])
                                            if (horasKeys.length === 1 && horasKeys[0] !== nuevaHora) {
                                              calificaciones[reporteKey][nuevaHora] =
                                                calificaciones[reporteKey][horasKeys[0]]
                                              delete calificaciones[reporteKey][horasKeys[0]]
                                            } else if (horasKeys.includes(nuevaHora)) {
                                              horasKeys.forEach((horaExistente) => {
                                                if (horaExistente !== nuevaHora) {
                                                  delete calificaciones[reporteKey][horaExistente]
                                                }
                                              })
                                            }
                                          }
                                          newMap.set(puesto.id_puesto, { ...existing, calificaciones })
                                          return newMap
                                        })
                                      })
                                    }}
                                  >
                                    <SelectTrigger
                                      className={`w-[60px]${editMode && !hora ? " border border-red-500" : ""}`}
                                    >
                                      <SelectValue placeholder="HH" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((hh) => (
                                        <SelectItem key={hh} value={hh}>
                                          {hh}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span className="text-xl">:</span>
                                  <Select
                                    value={hora.split(":")[1] || ""}
                                    onValueChange={(value) => {
                                      const horasSel = hora.split(":")[0] || "00"
                                      const nuevaHora = `${horasSel}:${value}`
                                      setHorasColumnas((h) => ({ ...h, [col.key]: nuevaHora }))
                                      setHorasEditadas(true)
                                      puestos.forEach((puesto) => {
                                        setPendingChanges((prev) => {
                                          const newMap = new Map(prev)
                                          const existing = newMap.get(puesto.id_puesto) || {
                                            idPuesto: puesto.id_puesto,
                                            calificaciones: {
                                              ...cumplidos[puesto.id_puesto]?.diurno?.calificaciones,
                                              ...cumplidos[puesto.id_puesto]?.b?.calificaciones,
                                              ...cumplidos[puesto.id_puesto]?.nocturno?.calificaciones,
                                            },
                                          }
                                          const calificaciones = { ...existing.calificaciones }
                                          const reporteKey = col.key
                                          if (calificaciones[reporteKey]) {
                                            const horasKeys = Object.keys(calificaciones[reporteKey])
                                            if (horasKeys.length === 1 && horasKeys[0] !== nuevaHora) {
                                              calificaciones[reporteKey][nuevaHora] =
                                                calificaciones[reporteKey][horasKeys[0]]
                                              delete calificaciones[reporteKey][horasKeys[0]]
                                            } else if (horasKeys.includes(nuevaHora)) {
                                              horasKeys.forEach((horaExistente) => {
                                                if (horaExistente !== nuevaHora) {
                                                  delete calificaciones[reporteKey][horaExistente]
                                                }
                                              })
                                            }
                                          }
                                          newMap.set(puesto.id_puesto, { ...existing, calificaciones })
                                          return newMap
                                        })
                                      })
                                    }}
                                  >
                                    <SelectTrigger
                                      className={`w-[60px]${editMode && !hora ? " border border-red-500" : ""}`}
                                    >
                                      <SelectValue placeholder="MM" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")).map((mm) => (
                                        <SelectItem key={mm} value={mm}>
                                          {mm}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                            {contextMenu.visible && contextMenu.colKey === col.key && (
                              <div
                                style={{
                                  position: "fixed",
                                  top: contextMenu.y,
                                  left: contextMenu.x,
                                  background: "white",
                                  border: "1px solid #ccc",
                                  borderRadius: 6,
                                  zIndex: 10000,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  minWidth: 180,
                                  padding: 4,
                                }}
                              >
                                <button
                                  className="w-full text-left px-4 py-2 hover:bg-blue-100 rounded"
                                  onClick={() => handleAutocompletarColumna(col.key)}
                                >
                                  Autocompletar campos
                                </button>
                              </div>
                            )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const unidades = puestosOrdenados.reduce((acc: { [unidad: string]: Puesto[] }, puesto) => {
                        if (!acc[puesto.nombre_unidad]) acc[puesto.nombre_unidad] = []
                        acc[puesto.nombre_unidad].push(puesto)
                        return acc
                      }, {})
                      const rows: React.ReactNode[] = []
                      Object.entries(unidades).forEach(([nombre_unidad, puestos]) => {
                        puestos.forEach((puesto, idx) => {
                          const cumplidoDiurno = cumplidos[puesto.id_puesto]?.diurno
                          const cumplidoTurnoB = cumplidos[puesto.id_puesto]?.b
                          const cumplidoNocturno = cumplidos[puesto.id_puesto]?.nocturno
                          const nombreDiurno = cumplidoDiurno?.colaborador_diurno || cumplidoDiurno?.colaborador || ""
                          const nombreTurnoB = cumplidoTurnoB?.colaborador || ""
                          const nombreNocturno =
                            cumplidoNocturno?.colaborador_nocturno || cumplidoNocturno?.colaborador || ""

                          rows.push(
                            <TableRow key={`puesto-${puesto.id_puesto}`}>
                              {idx === 0 && (
                                <TableCell rowSpan={puestos.length} className="w-[24px] align-middle vertical-text">
                                  {nombre_unidad}
                                </TableCell>
                              )}
                              <TableCell className="w-[200px]">{puesto.nombre_puesto}</TableCell>
                              {["diurno", "24h"].includes(turnoFiltro) && (
                                <TableCell className="w-[200px]">{nombreDiurno}</TableCell>
                              )}
                              {["b", "24h"].includes(turnoFiltro) && (
                                <TableCell className="w-[200px]">{nombreTurnoB}</TableCell>
                              )}
                              {["nocturno", "24h"].includes(turnoFiltro) && (
                                <TableCell className="w-[200px]">{nombreNocturno}</TableCell>
                              )}
                              {horasFiltradas.map((col) => {
                                const hora = horasColumnas[col.key] || ""

                                // Buscar calificación en pending changes primero
                                const pending = pendingChanges.get(puesto.id_puesto)
                                let valorObj = pending?.calificaciones?.[col.key]?.[hora]

                                // Si no hay pending, buscar en las calificaciones existentes
                                if (!valorObj) {
                                  const calDiurnoCell = (cumplidoDiurno?.calificaciones as Record<string, any>)?.[col.key]?.[hora];
                                  const calBCell = (cumplidoTurnoB?.calificaciones as Record<string, any>)?.[col.key]?.[hora];
                                  const calNocturnoCell = (cumplidoNocturno?.calificaciones as Record<string, any>)?.[col.key]?.[hora];
                                  valorObj = calDiurnoCell || calBCell || calNocturnoCell;
                                }

                                const valor =
                                  typeof valorObj === "object" && valorObj !== null && "valor" in valorObj
                                  ? valorObj.valor
                                    : typeof valorObj === "object"
                                      ? ""
                                      : (valorObj ?? "")
                                const tieneNota =
                                  typeof valorObj === "object" &&
                                  valorObj !== null &&
                                  "nota" in valorObj &&
                                  valorObj.nota &&
                                  valorObj.nota.length > 0
                                const nota = tieneNota ? valorObj.nota : ""

                                const cell = (
                                  <TableCell
                                    key={col.key}
                                    className={"w-[140px] text-center " + (tieneNota ? "bg-red-100" : "")}
                                  >
                                    {editMode ? (
                                      <Input
                                        type="number"
                                        min="0"
                                        max="10"
                                        placeholder="Calif."
                                        value={valor === 0 ? "" : (valor === null ? "" : valor)}
                                        onChange={(e) => {
                                          const inputValue = e.target.value;
                                          const numericValue = inputValue === "" ? 0 : Number.parseInt(inputValue, 10);
                                          handleChange(
                                            puesto.id_puesto,
                                            `calificaciones.${col.key}`,
                                            numericValue,
                                          );
                                        }}
                                        onContextMenu={(e) => handleNotaContextMenu(e, puesto.id_puesto, col.key)}
                                      />
                                    ) : valor === 0 && tieneNota ? (
                                      ""
                                    ) : (
                                      valor
                                    )}
                                  </TableCell>
                                )

                                return tieneNota && !editMode ? (
                                  <Tooltip key={col.key}>
                                    <TooltipTrigger asChild>{cell}</TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs whitespace-pre-line">
                                      {nota}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  cell
                                )
                              })}
                            </TableRow>,
                          )
                        })
                      })
                      return rows
                    })()}
                  </TableBody>
                </Table>
              )}
            </TooltipProvider>
          </div>
        </div>

        {/* Modales y Diálogos */}
        <ConfiguracionesReportesModal
          open={modal.type === "config" && modal.open}
          onClose={() => {
            setModal({ type: null, open: false })
            cargarConfiguraciones()
          }}
          negocioId={negocioId}
        />

        <Dialog
          open={modal.type === "nota" && modal.open}
          onOpenChange={(open) => setModal((prev) => ({ ...prev, open, type: open ? prev.type : null }))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nota para {modal.config?.hora}</DialogTitle>
            </DialogHeader>
            <Textarea
              value={modal.config?.nota || ""}
              onChange={(e) => setModal((prev) => ({ ...prev, config: { ...prev.config!, nota: e.target.value } }))}
              placeholder="Ingrese la nota aquí..."
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button onClick={guardarNota}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={notaDialog.open} onOpenChange={(open) => setNotaDialog((prev) => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nota</DialogTitle>
            </DialogHeader>
            <Textarea
              value={notaDialog.nota}
              onChange={(e) => setNotaDialog((prev) => ({ ...prev, nota: e.target.value }))}
              placeholder="Ingrese la nota aquí..."
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button onClick={handleGuardarNota}>Guardar Nota</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog((prev) => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <div>{errorDialog.message}</div>
            <DialogFooter>
              <Button onClick={() => setErrorDialog({ open: false, message: "" })}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ModalConfirmacion
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleConfirmSalir}
          title="Salir sin guardar"
          description="Tienes cambios sin guardar. ¿Seguro que quieres salir y perder los cambios?"
        />

        <Dialog open={excelDialogOpen} onOpenChange={setExcelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Descargar Global</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex gap-2">
                <div className="flex flex-col">
                  <Label className="mb-2">Desde Año</Label>
                  <Select value={excelDesdeAnio} onValueChange={setExcelDesdeAnio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 13 }, (_, i) => {
                        const year = new Date().getFullYear() + i
                        return (
                          <SelectItem key={`desde-anio-${year}`} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <Label className="mb-2">Desde Mes</Label>
                  <Select value={excelDesdeMes} onValueChange={setExcelDesdeMes}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const mes = (i + 1).toString()
                        return (
                          <SelectItem key={`desde-mes-${mes}`} value={mes}>
                            {mes}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <Label className="mb-2">Desde Día</Label>
                  <Select value={excelDesdeDia} onValueChange={setExcelDesdeDia}>
                    <SelectTrigger>
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => {
                        const dia = (i + 1).toString()
                        return (
                          <SelectItem key={`desde-dia-${dia}`} value={dia}>
                            {dia}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col">
                  <Label className="mb-2">Hasta Año</Label>
                  <Select value={excelHastaAnio} onValueChange={setExcelHastaAnio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 13 }, (_, i) => {
                        const year = new Date().getFullYear() + i
                        return (
                          <SelectItem key={`hasta-anio-${year}`} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <Label className="mb-2">Hasta Mes</Label>
                  <Select value={excelHastaMes} onValueChange={setExcelHastaMes}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const mes = (i + 1).toString()
                        return (
                          <SelectItem key={`hasta-mes-${mes}`} value={mes}>
                            {mes}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <Label className="mb-2">Hasta Día</Label>
                  <Select value={excelHastaDia} onValueChange={setExcelHastaDia}>
                    <SelectTrigger>
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => {
                        const dia = (i + 1).toString()
                        return (
                          <SelectItem key={`hasta-dia-${dia}`} value={dia}>
                            {dia}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExcelDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleDescargarGlobal} className="bg-blue-700 text-white">
                Descargar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}

export default CumplidoNegocioTable
