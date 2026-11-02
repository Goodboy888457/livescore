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
  if(type==='live') endpoint = `https://api.apisport.online/api/v1/fixtures?live=true`;
  
  let res = await fetch(endpoint, { headers: { 'x-api-key': apiKey } });
  let json = await res.json();
  let data = json.data || json.response || [];
  
  let mapped = data.map(f=>{
    // TRY ALL POSSIBLE TEAM NAME FIELDS
    let home = f.home_team || f.homeTeam || f.home_name || f.teams?.home?.name || f.home?.name || (typeof f.homeTeam === 'string' ? f.homeTeam : null) || 'Home';
    let away = f.away_team || f.awayTeam || f.away_name || f.teams?.away?.name || f.away?.name || (typeof f.awayTeam === 'string' ? f.awayTeam : null) || 'Away';
    if(typeof home === 'object') home = home.name || 'Home';
    if(typeof away === 'object') away = away.name || 'Away';
    
    // TRY ALL SCORE FIELDS
    let hs = f.home_score ?? f.homeScore ?? f.goals?.home ?? f.score?.home ?? f.goals_home ?? 0;
    let as = f.away_score ?? f.awayScore ?? f.goals?.away ?? f.score?.away ?? f.goals_away ?? 0;
    if(typeof hs === 'object') hs = hs.current ?? 0;
    if(typeof as === 'object') as = as.current ?? 0;
    
    let status = f.status || f.fixture?.status?.short || 'FT';
    let clock = f.minute || f.clock || f.fixture?.status?.elapsed || '';
    
    return {
      id: f.id || f.fixture?.id || f.fixture_id || Math.random(),
      league: { name: f.league?.name || f.league_name || f.competition || 'Football' },
      homeTeam: { name: String(home) },
      awayTeam: { name: String(away) },
      state: { description: status, clock: clock, score: { current: `${hs}-${as}` } },
      score: { current: `${hs}-${as}` }
    };
  });
  
  return new Response(JSON.stringify({ data: mapped }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
 }catch(e){
  return new Response(JSON.stringify({ data: [], error: e.message }), { headers: { 'Content-Type': 'application/json' } });
 }
}
