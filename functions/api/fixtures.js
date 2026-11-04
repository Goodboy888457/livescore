export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const key = context.env.SPORTAPI_KEY;
  if(!key){
    return new Response(JSON.stringify({success:false, data:[], error:"NO KEY SET IN CLOUDFLARE"}),{
      headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });
  }
  const r = await fetch(`https://sportapi.ai/api/fixtures/date/${date}`, {
    headers:{"X-Api-Key": key}
  });
  const d = await r.json();
  return new Response(JSON.stringify(d),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Cache-Control":"no-cache"}
  });
}
