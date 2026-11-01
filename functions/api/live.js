export async function onRequest(context){
 const key = context.env.FOOTBALL_API_KEY;
 const res = await fetch('https://v3.football.api-sports.io/fixtures?live=all',{headers:{'x-apisports-key':key}});
 const data = await res.text();
 return new Response(data,{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
