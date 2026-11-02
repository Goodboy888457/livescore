export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 
 if(!apiKey){
   return new Response(JSON.stringify({response: [], error: 'NO API KEY'}), {
     headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
   });
 }

 try{
   let res = await fetch(`https://api.apisport.online/api/v1/livescore?sport=football`, {
     headers: { 'x-api-key': apiKey }
   });
   let json = await res.json();
   let leagues = json.data || json.response || [];
   
   let liveGames = [];
   
   leagues.forEach(leagueObj=>{
     if(leagueObj.fixtures){
       let leagueName = leagueObj.name || 'Football';
       let country = (leagueObj.country?.name || leagueObj.country || 'World').replace(' Amateur','').trim();
       let slug = leagueObj.slug || leagueName.toLowerCase().replace(/\s+/g,'-');
       
       leagueObj.fixtures.forEach(f=>{
         // Only LIVE games
         if(f.status === 'LIVE' || f.status === '1H' || f.status === '2H' || f.status === 'HT'){
           let hs = f.result?.homeScore ?? 0;
           let as = f.result?.awayScore ?? 0;
           let minute = f.minute ? f.minute+"'" : 'LIVE';
           
           liveGames.push({
             id: f.id,
             league: { name: leagueName, slug: slug, country: country },
             teams: { home: {name: f.homeTeam?.name || 'Home'}, away: {name: f.awayTeam?.name || 'Away'} },
             goals: { home: hs, away: as },
             status: minute,
             minute: f.minute || 0
           });
         }
       });
     }
   });
   
   return new Response(JSON.stringify({
     response: liveGames,
     data: liveGames,
     count: liveGames.length,
     type: 'live'
   }), {
     headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=15'}
   });
   
 }catch(e){
   return new Response(JSON.stringify({response: [], error: e.message}), {
     headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
   });
 }
}
