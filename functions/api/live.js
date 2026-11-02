export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let type = url.searchParams.get('type') || 'today';
  let date = new Date();
  if(type==='yesterday') date.setDate(date.getDate()-1);
  if(type==='tomorrow') date.setDate(date.getDate()+1);
  let dateStr = date.toISOString().split('T')[0];
  
  let endpoint = `https://api.apisport.online/fixtures?date=${dateStr}`;
  if(type==='live') endpoint = `https://api.apisport.online/fixtures?live=all`;
  
  let res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${apiKey}` } });
  let json = await res.json();
  let data = json.response || json.data || [];
  
  let mapped = data.map(f=>({
    id: f.fixture?.id || f.id,
    league: { name: f.league?.name || 'League' },
    homeTeam: { name: f.teams?.home?.name || f.homeTeam || 'Home' },
    awayTeam: { name: f.teams?.away?.name || f.awayTeam || 'Away' },
    state: { description: f.fixture?.status?.short || 'NS', clock: f.fixture?.status?.elapsed || '', score: { current: `${f.goals?.home ?? 0}-${f.goals?.away ?? 0}` } },
    score: { current: `${f.goals?.home ?? 0}-${f.goals?.away ?? 0}`, home: f.goals?.home, away: f.goals?.away }
  }));
  
  return new Response(JSON.stringify({ data: mapped }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
 }catch(e){
  return new Response(JSON.stringify({ data: [], error: e.message }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
 }
}
