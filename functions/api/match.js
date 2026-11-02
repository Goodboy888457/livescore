export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 const url = new URL(context.request.url);
 const id = url.searchParams.get('id');
 if(!id) return new Response(JSON.stringify({error:'no id'}), {headers:{'Content-Type':'application/json'}});

 // Try to fetch all match details from apisport
 const endpoints = [
   `https://api.apisport.online/api/v1/match?id=${id}`,
   `https://api.apisport.online/api/v1/matches/${id}`,
   `https://api.apisport.online/api/v1/lineups?matchId=${id}`,
   `https://api.apisport.online/api/v1/stats?matchId=${id}`
 ];

 let data = { id };
 for(let ep of endpoints){
   try{
     let r = await fetch(ep, {headers:{'x-api-key':apiKey}});
     let j = await r.json();
     data = {...data, ...j.data, raw:j};
   }catch(e){}
 }

 return new Response(JSON.stringify(data), {
   headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
 });
}
