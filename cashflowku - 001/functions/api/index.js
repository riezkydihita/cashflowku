// Entry point Cloudflare Worker.
// - Request ke /api/data  -> ditangani di sini (baca/tulis ke Workers KV)
// - Request lainnya       -> diserahkan ke static assets (isi folder public/)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function isValidId(id) {
  // Kode sinkron: 6-24 karakter alfanumerik saja.
  return typeof id === 'string' && /^[a-zA-Z0-9]{6,24}$/.test(id);
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function handleApiData(request, env) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!isValidId(id)) {
    return jsonResponse({ error: 'Kode sinkron tidak valid' }, 400);
  }

  if (request.method === 'GET') {
    const value = await env.CASHFLOW_KV.get(id);
    return new Response(value || '{}', {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  if (request.method === 'POST') {
    let body;
    try {
      body = await request.text();
      JSON.parse(body); // validasi JSON
    } catch (e) {
      return jsonResponse({ error: 'Body bukan JSON valid' }, 400);
    }
    if (body.length > 200_000) {
      return jsonResponse({ error: 'Data terlalu besar' }, 413);
    }
    await env.CASHFLOW_KV.put(id, body);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: 'Method tidak didukung' }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/data') {
      return handleApiData(request, env);
    }

    // Selain /api/data, serve file statis dari folder public/
    return env.ASSETS.fetch(request);
  },
};
