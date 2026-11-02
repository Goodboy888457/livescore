export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let type = url.searchParams.get('type') || 'today';
  let date = new Date();
  if(type==='yesterday') date.setDate(date.getDate()-1);
  if(type==='tomorrow') date.setDate(date.getDate()+1);
  let dateStr = date.toISOString().split('T')[0];
  
  let endpoint = `https://api.apisport.online/api/v1/fixtures?date=${dateStr}`;
  if(type==='live') endpoint = `https://api.apisport.online/api/v1/livescore`;
  if(type==='finished') endpoint = `https://api.apisport.online/api/v1/fixtures?date=${dateStr}`;
  if(type==='today') endpoint = `https://api.apisport.online/api/v1/fixtures?date=${dateStr}`;
  
  let res = await fetch(endpoint, { 
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' } 
  });
  let json = await res.json();
  let data = json.data || json.response || json || [];
  if(!Array.isArray(data)) data = [data];
  
  let mapped = data.map(f=>{
    let home = f.home_team || f.homeTeam || f.teams?.home?.name || f.home?.name || 'Home';
    let away = f.away_team || f.awayTeam || f.teams?.away?.name || f.away?.name || 'Away';
    if(typeof home === 'object') home = home.name||'Home';
    if(typeof away === 'object') away = away.name||'Away';
    
    let hs = f.home_score ?? f.score?.home ?? f.goals?.home ?? 0;
    let as = f.away_score ?? f.score?.away ?? f.goals?.away ?? 0;
    if(typeof hs === 'object') hs = hs.current ?? hs.goals ?? 0;
    if(typeof as === 'object') as = as.current ?? as.goals ?? 0;
    
    return {
      id: f.id || f.fixture_id || Math.random(),
      league: { name: f.league_name || f.league?.name || f.competition || 'Football' },
      homeTeam: { name: String(home) },
      awayTeam: { name: String(away) },
      state: { description: f.status || f.state || 'FT', clock: f.minute || f.time || '' , score: { current: `${hs}-${as}` } },
      score: { current: `${hs}-${as}` }
    };
  });
  
  return new Response(JSON.stringify({ data: mapped }), { 
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
  });
 }catch(e){
  return new Response(JSON.stringify({ data: [], error: e.message }), { headers: { 'Content-Type': 'application/json' } });
 }
}
