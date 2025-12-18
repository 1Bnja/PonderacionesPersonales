/**
 * Parser de imágenes usando Claude Vision API (Anthropic)
 * Alternativa: OpenAI GPT-4 Vision
 */

export async function parseImageToRamos(imageFile) {
  // Convertir imagen a base64
  const base64Image = await fileToBase64(imageFile)

  // Llamar a Claude Vision API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageFile.type,
              data: base64Image
            }
          },
          {
            type: 'text',
            text: `Extrae la información de notas de esta tabla de la intranet universitaria.

Devuelve un JSON con esta estructura exacta:
{
  "ramos": [
    {
      "nombre": "NOMBRE DEL RAMO",
      "unidades": [
        {
          "nombre": "NOMBRE UNIDAD",
          "peso": 40,
          "evaluaciones": [
            {
              "nombre": "Tipo de evaluación",
              "fecha": "DD/MM/YYYY",
              "peso": 20,
              "nota": 6.5
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANTE:
- Si una evaluación no tiene nota, usa null
- Los pesos deben sumar 100% en cada unidad
- Extrae TODAS las evaluaciones que veas`
          }
        ]
      }]
    })
  })

  const data = await response.json()
  const jsonText = data.content[0].text

  // Extraer JSON del texto (puede venir envuelto en markdown)
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("No se pudo extraer JSON de la respuesta")

  const parsed = JSON.parse(jsonMatch[0])

  // Agregar IDs a cada elemento
  return parsed.ramos.map(ramo => ({
    id: crypto.randomUUID(),
    ...ramo,
    unidades: ramo.unidades.map(unidad => ({
      id: crypto.randomUUID(),
      ...unidad,
      evaluaciones: unidad.evaluaciones.map(eva => ({
        id: crypto.randomUUID(),
        ...eva
      }))
    }))
  }))
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
