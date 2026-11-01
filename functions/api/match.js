export async function onRequest(context){
 const key = context.env.HIGHLIGHTLY_API_KEY;
 const u = new URL(context.request.url);
 const id = u.searchParams.get('id');
 const url = `https://sports.highlightly.net/football/match?id=${id}`;
 const r = await fetch(url, {headers:{'x-rapidapi-key':key}});
 const text = await r.text();
 return new Response(text, {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
