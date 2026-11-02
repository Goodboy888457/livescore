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
  
  let mapped = data.map(f=>({
    id: f.id || f.fixture?.id,
    league: { name: f.league?.name || 'League' },
    homeTeam: { name: f.home_team || f.teams?.home?.name || 'Home' },
    awayTeam: { name: f.away_team || f.teams?.away?.name || 'Away' },
    state: { description: f.status || 'NS', clock: '', score: { current: `${f.home_score ?? 0}-${f.away_score ?? 0}` } },
    score: { current: `${f.home_score ?? 0}-${f.away_score ?? 0}` }
  }));
  
  return new Response(JSON.stringify({ data: mapped }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
 }catch(e){
  return new Response(JSON.stringify({ data: [], error: e.message }), { headers: { 'Content-Type': 'application/json' } });
 }
}
