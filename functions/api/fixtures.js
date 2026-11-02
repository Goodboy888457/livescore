export async function onRequest(context){
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = dateStr === todayStr;

  if(!apiKey){
    return new Response(JSON.stringify({response:[], error:"NO KEY - Set APISPORT_API_KEY in Cloudflare Variables"}), 
    {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }

  try{
    let matches = [];
    let apiUrl = '';

    // FREE PLAN: TODAY USE LIVESCORE LITE (REAL 2:6, 4:2!) - FROM YOUR DASHBOARD
    if(isToday){
      apiUrl = `https://api.apisport.online/api/v1/livescore/lite`;
    } else {
      // FUTURE DATES: USE FIXTURES
      apiUrl = `https://api.apisport.online/api/v1/fixtures?date=${dateStr}&sport=football&limit=200`;
    }

    let res = await fetch(apiUrl, {
      headers: { 'x-api-key': apiKey }
    });

    let json = await res.json();
    
    if(isToday){
      // LIVESCORE LITE FORMAT - DIRECT ARRAY
      let data = json.data || json.response || json || [];
      let flat = Array.isArray(data) ? data : (data.fixtures || []);
      
      // LIVESCORE LITE returns leagues? Check both
      if(flat.length>0 && flat[0].fixtures){
        flat.forEach(league=>{
          (league.fixtures||[]).forEach(f=>{
            matches.push({
              league:{name:league.name||'Live', slug:league.slug||'live', country:(league.country?.name||'World').replace(' Amateur','')},
              teams:{home:{name:f.homeTeam?.name||f.home_team?.name}, away:{name:f.awayTeam?.name||f.away_team?.name}},
              goals:{home:f.result?.homeScore ?? f.homeScore, away:f.result?.awayScore ?? f.awayScore},
              status:f.status, time:'', elapsed:f.elapsed||f.minute||''
            });
          });
        });
      } else {
        flat.forEach(f=>{
          if(!f.homeTeam && !f.home_team) return;
          matches.push({
            league:{name:f.league?.name||f.competition?.name||'Live', slug:'live', country:'World'},
            teams:{home:{name:f.homeTeam?.name||f.home_team?.name}, away:{name:f.awayTeam?.name||f.away_team?.name}},
            goals:{home:f.result?.homeScore ?? f.homeScore, away:f.result?.awayScore ?? f.awayScore},
            status:f.status||'LIVE', time:'', elapsed:f.elapsed||''
          });
        });
      }
    } else {
      // FIXTURES BY DATE FORMAT
      let leagues = json.data || [];
      leagues.forEach(league=>{
        (league.fixtures||[]).forEach(f=>{
          matches.push({
            league:{name:league.name, slug:league.slug, country:(league.country?.name||'World').replace(' Amateur','')},
            teams:{home:{name:f.homeTeam.name}, away:{name:f.awayTeam.name}},
            goals:{home:f.result?.homeScore, away:f.result?.awayScore},
            status:f.status,
            time:f.startTime? new Date(f.startTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'',
            elapsed:f.elapsed||''
          });
        });
      });
    }

    return new Response(JSON.stringify({response:matches, count:matches.length, date:dateStr, isToday:isToday}), {
      headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=20'}
    });

  }catch(e){
    return new Response(JSON.stringify({response:[], error:e.message}), 
    {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
}
