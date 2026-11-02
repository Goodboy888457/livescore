export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let leagueName = url.searchParams.get('leagueName') || 'Premier League';
  
  const leagueMap = {
    'Premier League': 1, 'La Liga': 2, 'Bundesliga': 3, 'Serie A': 4, 'Ligue 1': 5,
    'Primeira Liga': 8, 'Eredivisie': 9, 'Jupiler': 10, 'Super Lig': 12, 'Saudi': 14, 'Champions League': 101
  };
  
  let leagueId = leagueMap[leagueName] || 1;
  let endpoint = `https://api.apisport.online/api/v1/standings?league_id=${leagueId}`;
  
  let res = await fetch(endpoint, { headers: { 'x-api-key': apiKey } });
  let json = await res.json();
  let data = json.data || json.response || json || [];
  if(!Array.isArray(data)) data = data.standings || data.table || [data];
  
  let mapped = data.map((t,i)=>{
    return {
      rank: t.position || t.rank || i+1,
      team: { name: t.team_name || t.team?.name || t.name || 'Team' },
      points: t.points || t.pts || 0,
      all: { played: t.played || t.matches || 0 },
      goalsDiff: t.goal_diff || t.gd || 0
    };
  });
  
  return new Response(JSON.stringify({ response: mapped }), { 
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
  });
 }catch(e){
  return new Response(JSON.stringify({ response: [] }), { headers: { 'Content-Type': 'application/json' } });
 }
}
