export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let leagueName = (url.searchParams.get('leagueName')||'Premier League').toLowerCase();
  
  // apisport.online league IDs - CORRECT FOR YOUR API!
  const leagueMap = {
    'premier league': 1, 'epl': 1, 'england': 1,
    'la liga': 2, 'spain': 2,
    'bundesliga': 3, 'germany': 3,
    'serie a': 4, 'italy': 4,
    'ligue 1': 5, 'france': 5,
    'primeira liga': 8, 'portugal': 8, 'liga portugal': 8,
    'eredivisie': 9, 'netherlands': 9,
    'champions league': 101, 'ucl': 101,
    'europa league': 102,
    'championship': 7,
    'jupiler': 10, 'belgium': 10,
    'super lig': 12, 'turkey': 12,
    'saudi': 14, 'saudi pro': 14
  };
  
  let leagueId = 1;
  for(let k in leagueMap){
    if(leagueName.includes(k)){ leagueId = leagueMap[k]; break; }
  }
  
  let res = await fetch(`https://api.apisport.online/api/v1/standings?league_id=${leagueId}&season=2025`, {
    headers: { 'x-api-key': apiKey }
  });
  
  let json = await res.json();
  let data = json.data || json.response || [];
  let standings = data[0]?.standings || data || [];
  if(!Array.isArray(standings)) standings = [];
  
  let table = standings.map((t,i) => ({
    rank: t.position || t.rank || i+1,
    team: { name: t.team_name || t.team?.name || 'Team' },
    points: t.points || 0,
    all: { played: t.played || t.all?.played || 0 },
    goalsDiff: t.goal_diff || t.goalsDiff || 0,
    form: t.form || ''
  }));
  
  return new Response(JSON.stringify({ response: table }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
 }catch(e){
  return new Response(JSON.stringify({ response: [] }), {
    headers: { 'Content-Type': 'application/json' }
  });
 }
}
