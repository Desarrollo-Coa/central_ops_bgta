export async function generateStatsChart(
  estadisticas: any[],
  tipoNovedad: string,
  puesto: string,
  unidadNegocio: string
): Promise<string> {
  try {
    const response = await fetch(`${process.env.CANVAS_SERVICE_URL}/api/generate-stats-chart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        estadisticas,
        tipoNovedad,
        puesto,
        unidadNegocio
      })
    });

    if (!response.ok) {
      throw new Error('Error al generar el gráfico');
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error('Error llamando al servicio de Canvas:', error);
    throw error;
  }
} 