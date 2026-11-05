export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const team1 = url.searchParams.get('team1');
  const team2 = url.searchParams.get('team2');
  
  if(!team1 || !team2){
    return new Response(JSON.stringify({error:"need team1 and team2"}), {status:400});
  }

  const res = await fetch(`https://sportapi.ai/api/fixtures/h2h/${team1}/${team2}`, {
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
