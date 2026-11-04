export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const API_KEY = env.SPORTAPI_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "Missing SPORTAPI_KEY env variable" }), {
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  const apiRes = await fetch(`https://sportapi.ai/api/fixtures/date/${date}`, {
    headers: { "X-Api-Key": API_KEY }
  });
  const data = await apiRes.json();
  return new Response(JSON.stringify(data), {
    status: apiRes.status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" }
  });
}
