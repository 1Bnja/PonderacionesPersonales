/**
 * Calcula todas las estadísticas de un ramo.
 */
export function calcularEstadisticasRamo(ramo, notaAprobacion = 4.0) {
    let acumuladoRamo = 0; 
    let pesoTotalEvaluado = 0; 
  
    // Calcular Unidades
    const unidadesCalculadas = ramo.unidades.map(unidad => {
      let acumuladoUnidad = 0;
      let pesoUnidadEvaluado = 0;

      const evaluacionesProcesadas = unidad.evaluaciones.map(ev => {
          if (ev.nota !== null && ev.nota > 0) {
              acumuladoUnidad += ev.nota * (ev.peso / 100);
              pesoUnidadEvaluado += ev.peso;
          }
          return ev;
      });

      // Promedio ponderado de la unidad (suma directa de los aportes)
      // Ejemplo: 5.1×50% + 6.5×30% = 2.55 + 1.95 = 4.5
      let promedioActualUnidad = acumuladoUnidad;

      // Calcular aporte al ramo
      // La unidad aporta su acumulado multiplicado por el peso de la unidad
      // Ejemplo: Unidad vale 40%, acumulado 4.5 → aporta 4.5 * 0.4 = 1.8 puntos
      if (pesoUnidadEvaluado > 0) {
          acumuladoRamo += acumuladoUnidad * (unidad.peso / 100);
          pesoTotalEvaluado += (pesoUnidadEvaluado / 100) * unidad.peso;
      }

      return {
          ...unidad,
          promedioActual: parseFloat(promedioActualUnidad.toFixed(2)),
          progreso: pesoUnidadEvaluado
      };
    });

    // Cálculos Finales del Ramo
    // acumuladoRamo = puntos acumulados en la nota final
    // pesoTotalEvaluado = % del ramo que está evaluado

    // PROMEDIO ACTUAL: Suma de (promedio de cada unidad × peso de la unidad)
    // Ejemplo: 6.18×0.2 + 6.45×0.4 + 4.5×0.4 = 5.616
    let promedioActualRamo = acumuladoRamo;

    // Cálculo de Nota Necesaria
    const pesoRestante = 100 - pesoTotalEvaluado;
    let notaNecesaria = 0;
    let estado = "APROBADO";

    if (pesoRestante <= 0) {
        // Ramo completamente evaluado
        notaNecesaria = 0;
        estado = promedioActualRamo >= notaAprobacion ? "APROBADO" : "REPROBADO";
    } else {
        // Calcular qué nota necesito en el resto del ramo para aprobar
        // Fórmula: NotaFinal = acumuladoRamo + (NotaNecesaria * pesoRestante/100)
        // Queremos: 4.0 = acumuladoRamo + (X * pesoRestante/100)
        // Entonces: X = (4.0 - acumuladoRamo) / (pesoRestante/100)

        const puntosFaltantes = notaAprobacion - promedioActualRamo;

        if (puntosFaltantes <= 0) {
            estado = "APROBADO";
            notaNecesaria = 0;
        } else {
            notaNecesaria = (puntosFaltantes * 100) / pesoRestante;

            if (notaNecesaria > 7.0) estado = "IMPOSIBLE";
            else if (notaNecesaria > 6.0) estado = "CRÍTICO";
            else estado = "EN CURSO";
        }
    }
  
    return {
      ...ramo,
      unidades: unidadesCalculadas,
      estadisticas: {
          promedioActual: parseFloat(promedioActualRamo.toFixed(1)),
          pesoEvaluado: pesoTotalEvaluado,
          notaNecesaria: parseFloat(notaNecesaria.toFixed(1)),
          estado: estado
      }
    };
  }