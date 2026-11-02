export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY; // Your sk_live_ ID #142 from screenshot
 const url = new URL(context.request.url);
 let dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
 const todayStr = new Date().toISOString().split('T')[0];
 const isToday = dateStr === todayStr;

 try{
   let apiUrl = '';
   if(isToday){
     // USE YOUR LIVESCORE LITE FROM SCREENSHOT - REAL SCORES!
     apiUrl = `https://api.apisport.online/api/v1/livescore/lite`;
   } else {
     // FOR SUN 1/11 etc
     apiUrl = `https://api.apisport.online/api/v1/fixtures?date=${dateStr}&sport=football&limit=500`;
   }

   let res = await fetch(apiUrl, {
     headers: { 'x-api-key': apiKey }
   });
   let json = await res.json();
   let data = json.data || [];
   let matches = [];

   if(isToday){
     // LIVESCORE LITE FORMAT IS FLAT
     data.forEach(f=>{
       matches.push({
         league: { name: f.league?.name || f.competition?.name || 'Live', slug: f.league?.slug || 'live', country: (f.country?.name || 'World').replace(' Amateur','') },
         teams: { home:{name:f.homeTeam?.name || f.home_team?.name}, away:{name:f.awayTeam?.name || f.away_team?.name} },
         goals: { home: f.result?.homeScore ?? f.homeScore, away: f.result?.awayScore ?? f.awayScore },
         status: f.status,
         time: f.startTime ? new Date(f.startTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '',
         elapsed: f.elapsed || f.minute || ''
       });
     });
   } else {
     // FIXTURES BY DATE - HAS LEAGUES -> FIXTURES
     data.forEach(league=>{
       let country = (league.country?.name || 'World').replace(' Amateur','');
       (league.fixtures||[]).forEach(f=>{
         let hs = f.result?.homeScore;
         let as = f.result?.awayScore;
         // DON'T CREATE FAKE 0:0 - KEEP NULL, FRONTEND WILL SHOW FT or vs
         matches.push({
           league: { name: league.name, slug: league.slug, country: country },
           teams: { home:{name:f.homeTeam.name}, away:{name:f.awayTeam.name} },
           goals: { home: hs, away: as },
           status: f.status,
           time: f.startTime ? new Date(f.startTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '',
           elapsed: f.elapsed || ''
         });
       });
     });
   }

   return new Response(JSON.stringify({response: matches}), {
     headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'max-age=30'}
   });
 }catch(e){
   return new Response(JSON.stringify({response:[], error:e.message}), {headers:{'Content-Type':'application/json'}});
 }
}
