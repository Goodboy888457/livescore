export async function onRequest(context){
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  if(!apiKey){
    return new Response(JSON.stringify({response:[], error:"NO KEY - Set APISPORT_API_KEY"}), 
    {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }

  try{
    let matches = [];
    let urls = [
      `https://api.apisport.online/api/v1/livescore/lite`,
      `https://api.apisport.online/api/v1/fixtures?date=${dateStr}&sport=football&limit=200`
    ];

    for(let apiUrl of urls){
      try{
        let res = await fetch(apiUrl, { headers: { 'x-api-key': apiKey } });
        let json = await res.json();
        let data = json.data || json.response || [];

        if(data.length && data[0].fixtures){
          data.forEach(league=>{
            (league.fixtures||[]).forEach(f=>{
              matches.push({
                id: f.id,
                league:{name:league.name, slug:league.slug, country:(league.country?.name||'World').replace(' Amateur','')},
                teams:{home:{name:f.homeTeam?.name||f.home_team?.name}, away:{name:f.awayTeam?.name||f.away_team?.name}},
                goals:{home:f.result?.homeScore ?? f.homeScore, away:f.result?.awayScore ?? f.awayScore},
                status:f.status, time:f.startTime? new Date(f.startTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'', elapsed:f.elapsed||''
              });
            });
          });
        } else {
          data.forEach(f=>{
            if(!f.homeTeam && !f.home_team && !f.league) return;
            if(f.fixtures) return;
            if(f.homeTeam || f.home_team){
              matches.push({
                id: f.id,
                league:{name:f.league?.name||'Live', slug:f.league?.slug||'live', country:'World'},
                teams:{home:{name:f.homeTeam?.name||f.home_team?.name}, away:{name:f.awayTeam?.name||f.away_team?.name}},
                goals:{home:f.result?.homeScore ?? f.homeScore, away:f.result?.awayScore ?? f.awayScore},
                status:f.status, elapsed:f.elapsed||''
              });
            }
          });
        }
      }catch(e){}
    }

    // Remove duplicates
    let seen=new Set(); let unique=[];
    matches.forEach(m=>{ 
      let k=`${m.teams.home.name}-${m.teams.away.name}`; 
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
