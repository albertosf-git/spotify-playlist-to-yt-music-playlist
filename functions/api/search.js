export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  if (!q) return new Response(JSON.stringify({ error: "Falta término de búsqueda" }), { status: 400 });

  // Lista de instancias de Piped (Failover automático)
  // Si Kavin cae, usa Otter, etc.
  const apis = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.otter.sh",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.drgns.space"
  ];

  for (const apiBase of apis) {
    try {
      // Tu servidor hace la petición (aquí no existe el bloqueo CORS)
      const targetUrl = `${apiBase}/streams/search?q=${encodeURIComponent(q)}`;
      
      const resp = await fetch(targetUrl, {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Compatible; MonoBridge/1.0)',
            'Accept': 'application/json'
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        // Devolvemos los datos limpios a tu frontend
        return new Response(JSON.stringify(data), {
          headers: { 
            'Content-Type': 'application/json',
            // Cacheamos la respuesta 1 hora para ir más rápido si buscas lo mismo
            'Cache-Control': 'public, max-age=3600' 
          }
        });
      }
    } catch (e) {
      // Si esta API falla, el bucle continúa silenciosamente a la siguiente
      continue;
    }
  }

  return new Response(JSON.stringify({ error: "No se pudo conectar con ninguna API de música." }), { status: 502 });
}