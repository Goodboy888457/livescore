export async function onRequestGet(c){
 const lid=new URL(c.request.url).searchParams.get('league_id');
 const KEY=c.env.HIGHLIGHTLY_API_KEY||c.env.HIGHLIGHTLY_KEY;
 const r=await fetch(`https://sports.highlightly.net/football/standings?league_id=${lid}`,{headers:{"x-api-key":KEY}});
 const j=await r.json();
 let data=j.data||j.standings||j||[];
 if(!Array.isArray(data)) data=[];
 return new Response(JSON.stringify({data}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
