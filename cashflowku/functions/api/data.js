// Cloudflare Pages Function: /api/data
// Menyimpan & mengambil data cashflow per "Kode Sinkron" (id) di Workers KV.
// Binding KV yang dipakai: CASHFLOW_KV (atur di Cloudflare Pages > Settings > Functions > KV bindings)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function isValidId(id) {
  // Kode sinkron: 6-24 karakter alfanumerik saja, mencegah key sembarangan.
  return typeof id === 'string' && /^[a-zA-Z0-9]{6,24}$/.test(id);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!isValidId(id)) {
    return new Response(JSON.stringify({ error: 'Kode sinkron tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  const value = await env.CASHFLOW_KV.get(id);
  return new Response(value || '{}', {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!isValidId(id)) {
    return new Response(JSON.stringify({ error: 'Kode sinkron tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  let body;
  try {
    body = await request.text();
    JSON.parse(body); // validasi JSON
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Body bukan JSON valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  if (body.length > 200_000) {
    return new Response(JSON.stringify({ error: 'Data terlalu besar' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  await env.CASHFLOW_KV.put(id, body);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
