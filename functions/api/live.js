export async function onRequest(context){
 const key = context.env.FOOTBALL_API_KEY;
 const url = new URL(context.request.url);
 const type = url.searchParams.get('type') || 'live';
 let apiUrl = '';
 if(type === 'today'){
   const today = new Date().toISOString().split('T')[0];
   apiUrl = `https://v3.football.api-sports.io/fixtures?date=${today}`;
 } else if(type === 'finished'){
   const today = new Date().toISOString().split('T')[0];
   apiUrl = `https://v3.football.api-sports.io/fixtures?date=${today}`;
 } else {
   apiUrl = 'https://v3.football.api-sports.io/fixtures?live=all';
 }
 const res = await fetch(apiUrl,{headers:{'x-apisports-key':key}});
 const data = await res.text();
 return new Response(data,{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
