export async function onRequest(context){
 const key = context.env.APISPORT_API_KEY;
 const url = new URL(context.request.url);
 let date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
 
 if(!key){
   return new Response(JSON.stringify({response: [], error: 'NO API KEY SET IN CLOUDFLARE'}), {headers:{'Content-Type':'application/json'}});
 }

 try{
   let apiRes = await fetch(`https://api.apisport.online/api/v1/matches?sport=football&date=${date}&limit=300`, {
     headers: { 'x-api-key': key }
   });
   let json = await apiRes.json();
   
   if(!json.success){
     return new Response(JSON.stringify({response: [], error: json.message || 'API ERROR', keyExists: !!key}), {headers:{'Content-Type':'application/json'}});
   }
   
   let formatted = (json.data || []).map(m=>({
     id: m.id,
     league: {
       name: m.league?.name || 'League',
       slug: m.league?.slug || 'premier-league',
       country: (m.league?.country?.name || 'World').replace(' Amateur','').trim()
     },
     teams: {
       home: {name: m.homeTeam?.name || 'Home'},
       away: {name: m.awayTeam?.name || 'Away'}
     },
     goals: { home: m.homeScore ?? 0, away: m.awayScore ?? 0 },
     status: m.status || 'FT'
   }));
   
   // If API returns empty for future date, keep empty (not demo) so you know key works
   return new Response(JSON.stringify({response: formatted, count: formatted.length, date: date}), {
     headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
   });
   
 }catch(e){
   return new Response(JSON.stringify({response: [], error: e.message}), {headers:{'Content-Type':'application/json'}});
 }
}
