export async function onRequestGet(context) {
  const { request, env } = context;
  const id = new URL(request.url).searchParams.get('id');
  const res = await fetch(`https://sportapi.ai/api/fixtures/${id}/stats`, {
    headers: { "X-Api-Key": env.SPORTAPI_KEY }
  });
  return new Response(await res.text(), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
