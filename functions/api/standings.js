export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const league_id = url.searchParams.get('id');
  
  if(!league_id){
    return new Response(JSON.stringify({error:"need id"}), {status:400});
  }

  const res = await fetch(`https://sportapi.ai/api/standings/${league_id}`, {
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
