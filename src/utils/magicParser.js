export function magicParser(rawText) {
  const ramosDetectados = [];
  const lineas = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let ramoActual = null;
  let unidadActual = null;
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i];

    // 1. DETECTAR NOMBRE DEL RAMO
    if (i + 1 < lineas.length && lineas[i + 1].includes('Area') && !linea.includes('Area') && !linea.includes('Evaluación')) {
      let nombre = linea
        .replace(/\(CURICO\)\s*/g, '')
        .replace(/^\s*-\s*/, '')
        .trim();

      if (nombre.length > 3 && !nombre.match(/^\d+%?$/)) {
        ramoActual = {
          id: crypto.randomUUID(),
          nombre: nombre,
          unidades: []
        };
        ramosDetectados.push(ramoActual);
        unidadActual = null;
      }
      i++;
      continue;
    }

    // 2. DETECTAR UNIDAD
    if (ramoActual && (linea.includes('NO EXIGIBLE') || linea.includes('EXIGIBLE'))) {
      let nombreUnidad = '';
      let peso = 0;

      const match = linea.match(/(.*?)(NO EXIGIBLE|EXIGIBLE)(.*)/);
      if (match) {
        nombreUnidad = match[1].trim();
        const despuesExigible = match[3].trim();

        if (despuesExigible.includes('Requisito de aprobación')) {
          peso = 0;
        } else {
          // Busca el primer número al inicio del resto de la línea
          const pesoMatch = despuesExigible.match(/^(\d{1,3})/);
          if (pesoMatch) peso = parseInt(pesoMatch[1]);
        }
      }

      if (nombreUnidad.length > 0) {
        unidadActual = {
          id: crypto.randomUUID(),
          nombre: nombreUnidad,
          peso: peso,
          evaluaciones: []
        };
        ramoActual.unidades.push(unidadActual);
      }
      i++;
      continue;
    }

    // 3. DETECTAR EVALUACIÓN (LÓGICA CORREGIDA)
    if (unidadActual && linea.match(/^Evaluación\s+\d+/i)) {
      
      // ESTRATEGIA: Usar la fecha como ancla para separar texto de números
      const fechaMatch = linea.match(/(\d{2}\/\d{2}\/\d{4})/);
      
      let nombre = 'Evaluación';
      let fecha = 'Sin fecha';
      let peso = 0;
      let nota = null;

      if (fechaMatch) {
        fecha = fechaMatch[1];
        
        // Cortamos la línea usando la fecha
        const partes = linea.split(fechaMatch[0]); // [0]: "Evaluación 1 Informe...", [1]: " 60 6.8"
        
        // PROCESAR LADO IZQUIERDO (NOMBRE)
        if (partes[0]) {
            nombre = partes[0]
                .replace(/^Evaluación\s+\d+/, '') // Borra "Evaluación 1"
                .replace(/(Obligatoria|Acum\.Opcional|Requisito de aprobación)/g, '') // Borra palabras clave
                .trim();
        }

        // PROCESAR LADO DERECHO (NUMEROS)
        if (partes[1]) {
            const numerosRaw = partes[1].trim(); // Ej: "60 6.8" o "30"
            
            // Buscamos si termina en nota decimal (ej: 6.8)
            const notaMatch = numerosRaw.match(/(\d{1,2}\.\d)$/);

            if (notaMatch) {
                // Si hay nota (ej: 6.8), la sacamos
                nota = parseFloat(notaMatch[0]);
                // El peso es lo que queda (ej: 60)
                const pesoRaw = numerosRaw.replace(notaMatch[0], '').trim();
                peso = parseInt(pesoRaw) || 0;
            } else {
                // Si no hay decimal, asumimos que es solo peso (ej: 30)
                // Asegurándonos de que sea número
                if(numerosRaw.match(/^\d+$/)) {
                    peso = parseInt(numerosRaw) || 0;
                }
            }
        }
      } 
      // FALLBACK: Si no hay fecha, intentamos limpieza básica
      else {
          nombre = linea.replace(/^Evaluación\s+\d+/, '').trim();
      }

      unidadActual.evaluaciones.push({
        id: crypto.randomUUID(),
        nombre: nombre, // Ahora el nombre ya no tendrá el "60 6.8"
        fecha: fecha,
        peso: peso,
        nota: nota
      });
      i++;
      continue;
    }

    i++;
  }

  return ramosDetectados;
}