export async function onRequestGet(c){
 const id=new URL(c.request.url).searchParams.get('id');
 const KEY=c.env.HIGHLIGHTLY_API_KEY||c.env.HIGHLIGHTLY_KEY;
 const r=await fetch(`https://sports.highlightly.net/football/fixtures/${id}`,{headers:{"x-api-key":KEY}});
 const j=await r.json();
 const f=j.data||j||{};
 return new Response(JSON.stringify({fixture:f}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
