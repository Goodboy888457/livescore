export async function onRequestGet(context){
  const id=new URL(context.request.url).searchParams.get('id');
  const r=await fetch(`https://sportapi.ai/api/fixtures/${id}`,{headers:{"X-Api-Key":context.env.SPORTAPI_KEY}});
  const d=await r.json();
  return new Response(JSON.stringify(d),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
