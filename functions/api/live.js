export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 if(!apiKey){
   return new Response(JSON.stringify({response:[]}),{
     headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
   });
 }
 try{
   let res = await fetch(`https://api.apisport.online/api/v1/livescore?sport=football`,{
     headers:{'x-api-key': apiKey}
   });
   let json = await res.json();
   let leagues = json.data || [];
   let liveGames = [];
   leagues.forEach(leagueObj=>{
     let leagueName = leagueObj.name;
     let country = leagueObj.country?.name || 'World';
     let slug = leagueObj.slug;
     leagueObj.fixtures.forEach(f=>{
       let hs = f.result?.homeScore ?? 0;
       let as = f.result?.awayScore ?? 0;
       let minute = f.minute ? f.minute+"'" : 'LIVE';
       if(f.status === 'LIVE' || f.status === '1H' || f.status === '2H' || f.status === 'HT'){
         liveGames.push({
           id: f.id,
           league: { name: leagueName, slug: slug, country: country },
           teams: { home: {name: f.homeTeam?.name}, away: {name: f.awayTeam?.name} },
           goals: { home: hs, away: as },
           status: minute,
           minute: f.minute
         });
       }
     });
   });
   return new Response(JSON.stringify({response: liveGames}),{
     headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
   });
 }catch(e){
   return new Response(JSON.stringify({response:[]}),{
     headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
   });
 }
}
