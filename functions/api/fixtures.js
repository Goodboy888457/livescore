export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 const url = new URL(context.request.url);
 let dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
 if(dateStr==='today') dateStr = new Date().toISOString().split('T')[0];

 try{
   let realMatches = [];

   if(apiKey){
     // Try all APISport endpoints for real fixtures
     let endpoints = [
       `https://api.apisport.online/api/v1/fixtures/by-date?date=${dateStr}`,
       `https://api.apisport.online/api/v1/fixtures?date=${dateStr}&sport=football`,
       `https://api.apisport.online/api/v1/matches?date=${dateStr}`,
       `https://api.apisport.online/api/v1/livescore`,
       `https://api.apisport.online/api/v1/fixtures?day=today`
     ];

     for(let ep of endpoints){
       try{
         let res = await fetch(ep, {headers:{'x-api-key':apiKey}});
         let json = await res.json();
         let data = json.data || json.response || json.result || [];

         if(!data || !data.length) continue;

         // Parse - APISport returns leagues with fixtures inside
         data.forEach(item=>{
           // Format 1: { league: {...}, fixtures: [...] }
           if(item.fixtures && Array.isArray(item.fixtures)){
             let leagueName = item.name || item.league?.name || 'League';
             let country = item.country?.name || item.country || item.league?.country || 'World';
             let slug = item.slug || leagueName.toLowerCase().replace(/\s+/g,'-');
             item.fixtures.forEach(f=>{
               realMatches.push({
                 id: f.id || `${f.homeTeam?.id}-${f.awayTeam?.id}`,
                 league: { name: leagueName, slug: slug, country: country.replace(' Amateur','') },
                 teams: { home:{name: f.homeTeam?.name || f.home?.name || 'Home'}, away:{name: f.awayTeam?.name || f.away?.name || 'Away'} },
                 goals: { home: f.result?.homeScore ?? f.homeScore ?? f.goals?.home ?? 0, away: f.result?.awayScore ?? f.awayScore ?? f.goals?.away ?? 0 },
                 status: f.status || f.minute || 'FT'
               });
             });
           } 
           // Format 2: direct fixture { homeTeam, awayTeam, league }
           else if(item.homeTeam && item.awayTeam){
             realMatches.push({
               id: item.id,
               league: { name: item.league?.name || item.competition?.name || 'League', slug: (item.league?.slug||'premier-league'), country: (item.league?.country?.name||'World').replace(' Amateur','') },
               teams: { home:{name: item.homeTeam?.name}, away:{name: item.awayTeam?.name} },
               goals: { home: item.result?.homeScore ?? 0, away: item.result?.awayScore ?? 0 },
               status: item.status || 'FT'
             });
           }
         });

         if(realMatches.length>0) break;
       }catch(e){}
     }
   }

   // If still no real games, check if today has no games - don't show old demo
   if(realMatches.length===0){
     // Return empty so frontend shows "No games" not fake demo
     return new Response(JSON.stringify({response: [], data: [], date: dateStr, message:'No fixtures for this date'}), {
       headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
     });
   }

   return new Response(JSON.stringify({response: realMatches, data: realMatches}), {
     headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=60'}
   });

 }catch(e){
   return new Response(JSON.stringify({response: [], error: e.message}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }
}
