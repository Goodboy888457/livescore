export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 const url = new URL(context.request.url);
 let dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
 if(dateStr==='today') dateStr = new Date().toISOString().split('T')[0];

 try{
   let allMatches = [];
   let res = await fetch(`https://api.apisport.online/api/v1/fixtures?date=${dateStr}&sport=football&limit=500`, {
     headers:{'x-api-key': apiKey}
   });
   let json = await res.json();
   let leagues = json.data || [];

   leagues.forEach(league=>{
     let country = (league.country?.name || 'World').replace(' Amateur','').trim();
     let leagueName = league.name;
     let leagueSlug = league.slug;
     let isAmateur = (league.country?.name || '').includes('Amateur') || leagueName.toLowerCase().includes('u19') || leagueName.toLowerCase().includes('u17') || leagueName.toLowerCase().includes('u15') || leagueName.toLowerCase().includes('u20') || leagueName.toLowerCase().includes('veterana');

     league.fixtures?.forEach(f=>{
       let hs = f.result?.homeScore;
       let as = f.result?.awayScore;
       let status = f.status || 'NS';

       // FILTER FAKE 0:0 - IF FT BUT SCORE IS NULL, SKIP IT! DON'T SHOW 0:0
       if(status==='FT' && (hs===null || as===null)){
         return; // SKIP - This is why you saw Qsa Quartiere 0:0, Colorado 0:0 etc - APISPORT HAS NO SCORE FOR THEM
       }

       // ALSO SKIP AMATEUR LEAGUES WITH NULL SCORE IF YOU WANT ONLY REAL LEAGUES
       // Comment out next 3 lines if you want to keep amateur but with correct score handling
       if(isAmateur && (hs===null || as===null) && status!=='NS' && status!=='1H' && status!=='2H'){
         return;
       }

       // Format time
       let timeStr = '';
       if(f.startTime){
         let d = new Date(f.startTime);
         timeStr = d.toLocaleTimeString('en-GB',{hour:'2-digit', minute:'2-digit'});
       }

       allMatches.push({
         id: f.id,
         league: { name: leagueName, slug: leagueSlug, country: country },
         teams: { home:{name:f.homeTeam.name}, away:{name:f.awayTeam.name} },
         goals: { home: hs, away: as },
         status: status,
         statusLong: f.statusLong || status,
         startTime: f.startTime,
         time: timeStr,
         elapsed: f.elapsed || f.minute || null
       });
     });
   });

   // SORT: LIVE FIRST, THEN FT, THEN NS
   allMatches.sort((a,b)=>{
     let order = {'2H':0,'1H':1,'LIVE':2,'FT':3,'NS':4};
     return (order[a.status]||5) - (order[b.status]||5);
   });

   return new Response(JSON.stringify({response: allMatches, data: allMatches}), {
     headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=60'}
   });

 }catch(e){
   return new Response(JSON.stringify({response:[], error:e.message}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }
}
