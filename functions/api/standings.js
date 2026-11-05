export async function onRequestGet(context) {
  const { request, env } = context;
  const id = new URL(request.url).searchParams.get('id') || new URL(request.url).pathname.split('/').pop();
  const res = await fetch(`https://sportapi.ai/api/standings/${id}`, {
    headers: { "X-Api-Key": env.SPORTAPI_KEY }
  });
  return new Response(await res.text(), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
