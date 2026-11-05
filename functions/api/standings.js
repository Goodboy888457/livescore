export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || url.searchParams.get('leagueId') || '24';
  
  const res = await fetch(`https://sportapi.ai/api/standings/${id}`, {
    headers: { "X-Api-Key": env.SPORTAPI_KEY }
  });
  const text = await res.text();
  return new Response(text, { 
    headers: { 
      "Content-Type": "application/json", 
      "Access-Control-Allow-Origin": "*" 
    } 
  });
}
