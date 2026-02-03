export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();
    const url = body.url;

    // Limpieza del ID
    const playlistId = url.split('playlist/')[1]?.split('?')[0];

    if (!playlistId) {
      return new Response(JSON.stringify({ error: "Link no válido" }), { status: 400 });
    }

    // Petición al Embed
    const targetUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();

    // Extracción del JSON oculto
    const regex = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s;
    const match = html.match(regex);

    if (!match || !match[1]) {
      return new Response(JSON.stringify({ error: "No pude leer la playlist." }), { status: 500 });
    }

    const json = JSON.parse(match[1]);
    const entity = json?.props?.pageProps?.state?.data?.entity;

    if (!entity || !entity.trackList) {
      return new Response(JSON.stringify({ error: "Playlist vacía o privada." }), { status: 404 });
    }

    // AQUI ESTÁ EL CAMBIO: Extraemos título y canciones
    const playlistTitle = entity.name;
    const tracks = entity.trackList.map(item => ({
      titulo: item.title,
      artista: item.subtitle
    }));

    // Devolvemos todo junto
    return new Response(JSON.stringify({
      meta: {
        title: playlistTitle,
        count: tracks.length
      },
      tracks: tracks
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.toString() }), { status: 500 });
  }
}