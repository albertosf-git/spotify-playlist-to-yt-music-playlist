export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    const url = body.url;

    // 1. Limpiamos el ID de la playlist del link que nos pasan
    // Acepta formatos: https://open.spotify.com/playlist/ID...
    const playlistId = url.split('playlist/')[1]?.split('?')[0];

    if (!playlistId) {
      return new Response(JSON.stringify({ error: "Link no válido" }), { status: 400 });
    }

    // 2. Truco: Vamos a la URL del "Embed" (el reproductor pequeñito) que no pide login
    const targetUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();

    // 3. Buscamos los datos escondidos en el HTML (JSON parse)
    // Spotify guarda los datos en un script llamado __NEXT_DATA__
    const regex = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s;
    const match = html.match(regex);

    if (!match || !match[1]) {
      return new Response(JSON.stringify({ error: "No pude leer la playlist. Spotify bloqueó el acceso." }), { status: 500 });
    }

    const json = JSON.parse(match[1]);

    // Navegamos por la estructura interna de Spotify para sacar las canciones
    // Nota: Esta ruta puede cambiar si Spotify actualiza su web, pero hoy funciona.
    const listaCanciones = json?.props?.pageProps?.state?.data?.entity?.trackList;

    if (!listaCanciones) {
      return new Response(JSON.stringify({ error: "Playlist vacía o privada." }), { status: 404 });
    }

    // 4. Limpiamos y devolvemos solo Título y Artista
    const resultados = listaCanciones.map(item => ({
      titulo: item.title,
      artista: item.subtitle
    }));

    return new Response(JSON.stringify(resultados), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.toString() }), { status: 500 });
  }
}