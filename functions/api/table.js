export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let leagueName = (url.searchParams.get('leagueName')||'Premier League').toLowerCase();
  
  const leagueMap = {
    'premier league': 39, 'epl': 39, 'england': 39,
    'la liga': 140, 'spain': 140,
    'bundesliga': 78, 'germany': 78,
    'serie a': 135, 'italy': 135,
    'ligue 1': 61, 'france': 61,
    'primeira liga': 94, 'portugal': 94,
    'eredivisie': 88,
    'champions league': 2,
    'europa league': 3,
    'championship': 40,
    'jupiler': 144,
    'super lig': 203,
    'saudi': 307
  };
  
  let leagueId = 39;
  for(let k in leagueMap){
    if(leagueName.includes(k)){ leagueId = leagueMap[k]; break; }
  }
  
  let endpoint = `https://api.apisport.online/standings?league=${leagueId}&season=2025`;
  let res = await fetch(endpoint, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  if(!res.ok){
    endpoint = `https://api.apisport.online/api/v1/standings?league_id=${leagueId}&season=2025`;
    res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${apiKey}` } });
  }
  
  let json = await res.json();
  let data = json.response || json.data || [];
  let standings = data[0]?.league?.standings?.[0] || data[0] || data;
  if(!Array.isArray(standings)) standings = [];
  
  let table = standings.map((t,i) => ({
    rank: t.rank || i+1,
    team: { name: t.team?.name || t.name || 'Team' },
    points: t.points || 0,
    all: { played: t.all?.played || t.played || 0 },
    goalsDiff: t.goalsDiff || 0,
    form: t.form || ''
  }));
  
  return new Response(JSON.stringify({ response: table }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
 }catch(e){
  return new Response(JSON.stringify({ response: [], error: e.message }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
 }
}
