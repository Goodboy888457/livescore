export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 const type = new URL(context.request.url).searchParams.get('type') || 'all';
 if(!apiKey) return new Response(JSON.stringify({response:[]}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 try{
   let res = await fetch(`https://api.apisport.online/api/v1/livescore?sport=football`,{headers:{'x-api-key': apiKey}});
   let json = await res.json();
   let leagues = json.data || [];
   let allGames = [];
   let liveGames = [];
   leagues.forEach(leagueObj=>{
     let leagueName = leagueObj.name;
     let country = leagueObj.country?.name || 'World';
     let slug = leagueObj.slug;
     leagueObj.fixtures.forEach(f=>{
       let hs = f.result?.homeScore ?? 0;
       let as = f.result?.awayScore ?? 0;
       let minute = f.minute ? f.minute+"'" : f.status;
       let game = {
         id: f.id,
         league: { name: leagueName, slug: slug, country: country },
         teams: { home: {name: f.homeTeam?.name}, away: {name: f.awayTeam?.name} },
         goals: { home: hs, away: as },
         status: f.status,
         time: minute,
         minute: f.minute || 0
       };
       allGames.push(game);
       if(f.status === 'LIVE' || f.status === '1H' || f.status === '2H' || f.status === 'HT'){
         liveGames.push({...game, status: minute});
       }
     });
   });
   let result = type==='live' ? liveGames : allGames;
   return new Response(JSON.stringify({response: result}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }catch(e){return new Response(JSON.stringify({response:[]}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}})}
}
