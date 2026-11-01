export async function onRequest(context){
 const key = context.env.HIGHLIGHTLY_API_KEY;
 const url = new URL(context.request.url);
 const type = url.searchParams.get('type') || 'today';
 
 const today = new Date().toISOString().split('T')[0];
 // For Highlightly, ALWAYS use date - no live param
 let apiUrl = `https://sports.highlightly.net/football/matches?date=${today}`;
 
 // You can add limit if you want more games
 apiUrl += '&limit=100';

 const res = await fetch(apiUrl,{
   headers:{
     'x-rapidapi-key': key,
     'x-api-key': key
   }
 });
 const data = await res.text();
 return new Response(data,{
   headers:{
     'Content-Type':'application/json',
     'Access-Control-Allow-Origin':'*'
   }
 });
}
