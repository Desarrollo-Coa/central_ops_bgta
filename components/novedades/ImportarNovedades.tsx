import * as ExcelJS from 'exceljs'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

export default function ImportarNovedades() {
  const [modalOpen, setModalOpen] = useState(false)
  const [novedadesFaltantes, setNovedadesFaltantes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<{exitos: any[], errores: any[]} | null>(null)

  // 1. Leer archivo Excel
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const workbook = new ExcelJS.Workbook()
    const arrayBuffer = await file.arrayBuffer()
    await workbook.xlsx.load(arrayBuffer)
    
    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) return
    
    const json: any[] = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header row
      
      const rowData: any = {}
      row.eachCell((cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value?.toString() || ''
        rowData[header] = cell.value?.toString() || ''
      })
      json.push(rowData)
    })
    
    // 2. Extraer consecutivos y consultar al backend
    const consecutivos = json.map((row: any) => row['Consecutvo'] || row['Consecutivo'])
    setLoading(true)
    const res = await fetch('/api/novedades/novedades/validar-consecutivos', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({consecutivos})
    })
    const {faltantes} = await res.json()
    // 3. Filtrar novedades faltantes
    const novedadesFaltantes = json.filter((row: any) => faltantes.includes(row['Consecutvo'] || row['Consecutivo']))
    setNovedadesFaltantes(novedadesFaltantes)
    setLoading(false)
    setModalOpen(true)
  }

  // 4. Confirmar e insertar por lotes
  const handleConfirmar = async () => {
    setLoading(true)
    setResultados(null)
    const batchSize = 50
    let exitos: any[] = []
    let errores: any[] = []
    for (let i = 0; i < novedadesFaltantes.length; i += batchSize) {
      const lote = novedadesFaltantes.slice(i, i + batchSize)
      const res = await fetch('/api/novedades/novedades/importar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({novedades: lote})
      })
      const data = await res.json()
      if (data.exitos) exitos = exitos.concat(data.exitos)
      if (data.errores) errores = errores.concat(data.errores)
    }
    setResultados({exitos, errores})
    setLoading(false)
  }

  return (
    <div>
      <Button onClick={() => document.getElementById('importar-excel')?.click()}>Importar</Button>
      <input id="importar-excel" type="file" accept=".xlsx,.xls" style={{display: 'none'}} onChange={handleFile} />
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setResultados(null)
            setNovedadesFaltantes([])
            setLoading(false)
          }
        }}
      >
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle>Resumen de Importación</DialogTitle>
          </DialogHeader>
          <div>
            <div className="flex gap-4">
              {/* Left Section: Reporte de Errores */}
              <div className="w-1/3 bg-white rounded-xl shadow-md p-4 flex flex-col gap-4 overflow-y-auto max-h-[60dvh]">
                <AnimatePresence mode="wait">
                  {resultados && (
                    <motion.div
                      key={resultados.errores.length === 0 ? 'exito' : 'errores'}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.35 }}
                    >
                      <span className="text-lg font-semibold text-red-700 block mb-2">REPORTE DE ERRORES</span>
                      {resultados.errores.length === 0 ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-md">
                          <span className="text-green-700 text-lg font-semibold">¡Importación exitosa!</span>
                          <span className="text-green-900 text-2xl font-bold mt-2">{resultados.exitos.length} novedades insertadas correctamente.</span>
                        </div>
                      ) : (
                        <>
                          <div className="overflow-x-auto w-full">
                            <table className="min-w-[300px] w-full text-xs border border-red-200 bg-white rounded-xl">
                              <thead className="bg-red-100">
                                <tr>
                                  <th className="px-3 py-2 border-b border-red-200 text-left">Consecutivo</th>
                                  <th className="px-3 py-2 border-b border-red-200 text-left">Error</th>
                                </tr>
                              </thead>
                              <tbody>
                                {resultados.errores.map((err, i) => (
                                  <tr key={i} className="hover:bg-red-50">
                                    <td className="px-3 py-2 font-mono text-red-900">{err.consecutivo}</td>
                                    <td className="px-3 py-2 text-red-800 max-w-xs truncate" style={{maxWidth: '16rem'}} title={err.error}>{err.error}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-4 text-gray-700 text-sm">
                            Total exitosos: <b>{resultados.exitos.length}</b> | Total con error: <b>{resultados.errores.length}</b>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Section: Tabla */}
              <div className="w-2/3 bg-white rounded-xl shadow border border-gray-200 overflow-x-auto" style={{ height: '60dvh' }}> 
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Consecutivo</th>
                      <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Usuario</th>
                      <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Fecha Novedad</th>
                      <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Sede</th>
                      <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Zona</th>
                      <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {novedadesFaltantes.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50 transition">
                        <td className="px-3 py-2 font-mono text-blue-900">{row['Consecutvo']}</td>
                        <td className="px-3 py-2">{row['Usuario']}</td>
                        <td className="px-3 py-2">{row['Fecha y hora novedad']}</td>
                        <td className="px-3 py-2">{row['Sede']}</td>
                        <td className="px-3 py-2">{row['Zona']}</td>
                        <td className="px-3 py-2">{row['Descripción']?.slice(0, 80)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleConfirmar} disabled={loading || novedadesFaltantes.length === 0} className="px-8 py-2 text-base font-semibold">
                {loading ? 'Procesando...' : 'Confirmar e Importar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 