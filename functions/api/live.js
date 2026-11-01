export async function onRequest(context){
 const key = context.env.FOOTBALL_API_KEY;
 const url = new URL(context.request.url);
 const type = url.searchParams.get('type') || 'live';
 let apiUrl = 'https://v3.football.api-sports.io/fixtures?live=all';
 if(type === 'today' || type === 'finished'){
   const today = new Date().toISOString().split('T')[0];
   apiUrl = `https://v3.football.api-sports.io/fixtures?date=${today}`;
 }
 const res = await fetch(apiUrl,{headers:{'x-apisports-key':key}});
 const data = await res.text();
 return new Response(data,{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
