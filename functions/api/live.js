export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let type = url.searchParams.get('type') || 'today';
  let date = new Date();
  if(type==='yesterday') date.setDate(date.getDate()-1);
  if(type==='tomorrow') date.setDate(date.getDate()+1);
  let dateStr = date.toISOString().split('T')[0];
  
  let endpoint;
  if(type==='live'){
    endpoint = `https://api.apisport.online/api/v1/livescore`;
  } else {
    endpoint = `https://api.apisport.online/api/v1/fixtures/by-date?date=${dateStr}`;
  }
  
  let res = await fetch(endpoint, { headers: { 'x-api-key': apiKey } });
  let json = await res.json();
  let leagues = json.data || json.response || [];
  
  let mapped = [];
  leagues.forEach(leagueObj=>{
    let leagueName = leagueObj.name || leagueObj.league?.name || 'Football';
    let fixtures = leagueObj.fixtures || [];
    fixtures.forEach(f=>{
      // Time from startTime e.g. 13:45
      let time = 'FT';
      if(f.startTime){
        try{ time = new Date(f.startTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); }catch{}
      }
      if(f.status==='LIVE' || f.status==='1H' || f.status==='2H') time = f.minute ? f.minute+"'" : 'LIVE';
      if(f.status==='FT') time = 'FT';
      if(f.status==='NS') time = time; // show kickoff time
      
      let hs = f.result?.homeScore ?? f.result?.homeScoreHT ?? 0;
      let as = f.result?.awayScore ?? f.result?.awayScoreHT ?? 0;
      if(hs===null) hs = 0;
      if(as===null) as = 0;
      
      mapped.push({
        id: f.id,
        league: { name: leagueName },
        homeTeam: { name: f.homeTeam?.name || 'Home' },
        awayTeam: { name: f.awayTeam?.name || 'Away' },
        homeScore: hs,
        awayScore: as,
        state: { 
          description: f.status || 'NS', 
          clock: time, 
          score: { home: hs, away: as, current: `${hs}-${as}` } 
        },
        score: { current: `${hs}-${as}` }
      });
    });
  });
  
  return new Response(JSON.stringify({ data: mapped }), { 
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
  });
 }catch(e){
  return new Response(JSON.stringify({ data: [], error: e.message }), { headers: { 'Content-Type': 'application/json' } });
 }
}
