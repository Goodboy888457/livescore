export async function onRequest(context){
 const key = context.env.HIGHLIGHTLY_API_KEY;
 const url = new URL(context.request.url);
 const type = url.searchParams.get('type') || 'live';
 
 let apiUrl = 'https://sports.highlightly.net/football/matches';
 
 if(type === 'today'){
   const today = new Date().toISOString().split('T')[0];
   apiUrl = `https://sports.highlightly.net/football/matches?date=${today}`;
 } else if(type === 'finished'){
   const today = new Date().toISOString().split('T')[0];
   apiUrl = `https://sports.highlightly.net/football/matches?date=${today}`;
 } else {
   // live
   apiUrl = 'https://sports.highlightly.net/football/matches?live=all';
 }

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
