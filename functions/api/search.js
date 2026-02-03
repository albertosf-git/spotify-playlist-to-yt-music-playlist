export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  if (!q) return new Response(JSON.stringify({ error: "Falta término" }), { status: 400 });

  // LISTA DE INSTANCIAS INVIDIOUS (No Piped)
  // Estas suelen ser más robustas contra bloqueos de Cloudflare
  const instancias = [
    "https://yewtu.be",             // Holanda (Muy estable)
    "https://vid.puffyan.us",       // USA
    "https://invidious.drgns.space",// USA
    "https://inv.tux.pizza",        // USA
    "https://invidious.flokinet.to",// Rumanía
    "https://invidious.privacydev.net" // Francia
  ];

  const fakeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  for (const base of instancias) {
    try {
      // Invidious usa esta ruta, no /streams/search
      const targetUrl = `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`;
      
      const resp = await fetch(targetUrl, {
        headers: { 
            'User-Agent': fakeUserAgent
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        
        // Invidious devuelve un Array directo
        if (Array.isArray(data) && data.length > 0) {
          const videoId = data[0].videoId;
          
          // Devolvemos DIRECTAMENTE el ID, sin complicaciones
          return new Response(JSON.stringify({ id: videoId }), {
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=86400' 
            }
          });
        }
      }
    } catch (e) {
      continue;
    }
  }

  return new Response(JSON.stringify({ error: "No se encontró en ninguna instancia." }), { status: 502 });
}