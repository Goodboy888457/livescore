export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const API_KEY = env.SPORTAPI_KEY;
  if(!API_KEY) return new Response(JSON.stringify({ success:false, error:"Missing SPORTAPI_KEY env var" }), { status:500, headers:{"Content-Type":"application/json"} });
  const apiRes = await fetch(`https://sportapi.ai/api/fixtures/date/${date}`, {
    headers: { "X-Api-Key": API_KEY }
  });
  const data = await apiRes.text();
  return new Response(data, { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
