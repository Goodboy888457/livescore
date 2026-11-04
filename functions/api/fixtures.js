export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Get date from ?date=2026-11-04 or default to today
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const status = url.searchParams.get('status') || '';
  const season = url.searchParams.get('season') || '26/27';
  const timezone = url.searchParams.get('timezone') || 'UTC';

  // Your key should be set in Cloudflare Dashboard > Settings > Variables as APISPORT_KEY
  const API_KEY = env.APISPORT_KEY || env.API_KEY;

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "Missing APISPORT_KEY env variable" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const apiUrl = `https://api.apisport.online/api/v1/fixtures/by-date?date=${date}&status=${status}&season=${encodeURIComponent(season)}&timezone=${timezone}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      }
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
