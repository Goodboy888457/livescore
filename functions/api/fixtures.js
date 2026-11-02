export async function onRequest(context){
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  if(!apiKey){
    return new Response(JSON.stringify({response:[], error:"NO KEY"}), 
    {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }

  try{
    let matches = [];
    // Try BOTH endpoints
    let endpoints = [
      `https://api.apisport.online/api/v1/livescore/lite`,
      `https://api.apisport.online/api/v1/fixtures?date=${dateStr}&sport=football&limit=200`,
      `https://api.apisport.online/api/v1/livescore?sport=football`
    ];

    for(let apiUrl of endpoints){
      try{
        let res = await fetch(apiUrl, { headers: { 'x-api-key': apiKey } });
        let json = await res.json();
        
        // FORMAT 1: Raw livescore {s:1, d:[...]} <- YOUR SCREENSHOT FORMAT!
        let rawList = json.d || [];
        if(rawList.length){
          rawList.forEach(f=>{
            let hs = f.sc ? f.sc[0] : 0;
            let as = f.sc ? f.sc[1] : 0;
            matches.push({
              id: f.i,
              league:{name:'Live Football', slug:'live', country:'World'},
              teams:{home:{name:f.h?.n||'Home'}, away:{name:f.a?.n||'Away'}},
              goals:{home:hs, away:as},
              status:f.s||'LIVE',
              elapsed:f.s||'',
              time: f.t ? new Date(f.t*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : ''
            });
          });
          continue;
        }

        let data = json.data || json.response || [];

        if(data.length && data[0].fixtures){
          data.forEach(league=>{
            (league.fixtures||[]).forEach(f=>{
              matches.push({
                id: f.id || f.i,
                league:{name:league.name, slug:league.slug, country:(league.country?.name||'World').replace(' Amateur','')},
                teams:{home:{name:f.homeTeam?.name||f.home_team?.name||f.h?.n}, away:{name:f.awayTeam?.name||f.away_team?.name||f.a?.n}},
                goals:{home:f.result?.homeScore ?? f.homeScore ?? (f.sc?f.sc[0]:0), away:f.result?.awayScore ?? f.awayScore ?? (f.sc?f.sc[1]:0)},
                status:f.status||f.s, time:f.startTime? new Date(f.startTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'', elapsed:f.elapsed||f.s||''
              });
            });
          });
        } else {
          data.forEach(f=>{
            if(f.fixtures) return;
            if(f.homeTeam || f.home_team || f.h){
              matches.push({
                id: f.id || f.i,
                league:{name:f.league?.name||'Live', slug:f.league?.slug||'live', country:'World'},
                teams:{home:{name:f.homeTeam?.name||f.home_team?.name||f.h?.n}, away:{name:f.awayTeam?.name||f.away_team?.name||f.a?.n}},
                goals:{home:f.result?.homeScore ?? f.homeScore ?? (f.sc?f.sc[0]:null), away:f.result?.awayScore ?? f.awayScore ?? (f.sc?f.sc[1]:null)},
                status:f.status||f.s, elapsed:f.elapsed||f.s||''
              });
            }
          });
        }
      }catch(e){}
    }

    // Remove duplicates
    let seen=new Set(); let unique=[];
    matches.forEach(m=>{ 
      let k=`${m.teams.home.name}-${m.teams.away.name}-${m.id}`; 
      if(!seen.has(k)){seen.add(k); unique.push(m);} 
    });

    return new Response(JSON.stringify({response:unique, count:unique.length, date:dateStr}), {
      headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=20'}
    });
  }catch(e){
    return new Response(JSON.stringify({response:[], error:e.message}), 
    {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
}
