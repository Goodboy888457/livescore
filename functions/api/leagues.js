export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 let res = await fetch('https://api.apisport.online/api/v1/leagues?sport=football&limit=1000', {
   headers: { 'x-api-key': apiKey }
 });
 let json = await res.json();
 
 let unique = {};
 json.data?.forEach(l=>{
   if(l.priority >= 50 && !unique[l.slug]){
     unique[l.slug] = l;
   }
 });
 
 let leagues = Object.values(unique).map(l=>({
   name: l.name,
   slug: l.slug,
   country: l.country?.name,
   logo: l.logoUrl,
   priority: l.priority
 })).sort((a,b)=> b.priority - a.priority);
 
 return new Response(JSON.stringify({ response: leagues }), {
   headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
 });
}
