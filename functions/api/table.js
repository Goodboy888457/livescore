export async function onRequest(context){
 const key = context.env.FOOTBALL_API_KEY;
 const url = new URL(context.request.url);
 const league = url.searchParams.get('league') || '39';
 const season = url.searchParams.get('season') || '2026';
 const apiUrl = `https://v3.football.api-sports.io/standings?league=${league}&season=${season}`;
 const res = await fetch(apiUrl,{headers:{'x-apisports-key':key}});
 const data = await res.text();
 return new Response(data,{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
