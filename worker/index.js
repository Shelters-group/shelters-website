// Cloudflare Worker — proxy serveur entre la landing Astro et Brevo.
//
// Deux responsabilités :
//   1. POST /api/subscribe → crée / met à jour un contact dans la liste
//      Brevo "waiting list". La clé Brevo est lue depuis env.BREVO_API_KEY
//      (Secret runtime Cloudflare), jamais exposée au client ni au repo.
//   2. Toute autre requête → déléguée aux assets statiques générés par
//      `astro build` via le binding env.ASSETS.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/subscribe') {
      if (request.method !== 'POST') {
        return json({ error: 'method_not_allowed' }, 405, {
          Allow: 'POST',
        });
      }
      return handleSubscribe(request, env);
    }

    // Static assets fallback (landing Astro).
    return env.ASSETS.fetch(request);
  },
};

async function handleSubscribe(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'invalid_email' }, 400);
  }

  if (!env.BREVO_API_KEY) {
    // Missing runtime secret — visible côté ops via logs Cloudflare.
    return json({ error: 'server_misconfigured' }, 503);
  }

  const listId = Number(env.BREVO_LIST_ID ?? 3);
  if (!Number.isFinite(listId) || listId <= 0) {
    return json({ error: 'server_misconfigured' }, 503);
  }

  let upstream;
  try {
    upstream = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
      }),
    });
  } catch (err) {
    return json({ error: 'upstream_unreachable' }, 502);
  }

  // Brevo: 201 créé, 204 déjà présent mis à jour.
  if (upstream.ok || upstream.status === 204) {
    return json({ ok: true }, 200);
  }

  // Déjà inscrit → on considère ça comme un succès pour le visiteur.
  if (upstream.status === 400) {
    const data = await upstream.json().catch(() => ({}));
    if (data?.code === 'duplicate_parameter') {
      return json({ ok: true, duplicate: true }, 200);
    }
    return json({ error: 'invalid_request' }, 400);
  }

  // Sinon on remonte un code générique sans fuiter les détails.
  return json({ error: 'upstream_error', status: upstream.status }, 502);
}

function json(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(extraHeaders || {}),
    },
  });
}
