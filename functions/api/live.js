export async function onRequestGet(context){
  const date=new Date().toISOString().split('T')[0];
  const r=await fetch(`https://sportapi.ai/api/fixtures/date/${date}`,{headers:{"X-Api-Key":context.env.SPORTAPI_KEY}});
  const d=await r.json();
  const live = d.data ? d.data.filter(m=>m.status==="LIVE") : [];
  return new Response(JSON.stringify({success:true, data:live}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
