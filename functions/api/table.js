export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let leagueName = url.searchParams.get('leagueName') || 'Premier League';
  
  const slugMap = {
    'Premier League': 'premier-league',
    'La Liga': 'laliga',
    'Bundesliga': 'bundesliga',
    'Serie A': 'serie-a',
    'Ligue 1': 'ligue-1',
    'Primeira Liga': 'primeira-liga',
    'Eredivisie': 'eredivisie',
    'Jupiler': 'jupiler-pro-league',
    'Super Lig': 'super-lig',
    'Saudi': 'saudi-pro-league',
    'Champions League': 'uefa-champions-league',
    'Champions': 'uefa-champions-league'
  };
  
  let slug = slugMap[leagueName] || 'premier-league';
  // Handle if leagueName already slug
  if(leagueName.includes('-')) slug = leagueName.toLowerCase();
  
  let endpoint = `https://api.apisport.online/api/v1/standings?league=${slug}&season=2026/2027`;
  
  let res = await fetch(endpoint, { headers: { 'x-api-key': apiKey } });
  let json = await res.json();
  
  let overall = json.data?.standings?.Overall || json.data?.standings?.overall || json.data?.standings || json.data || [];
  if(!Array.isArray(overall)) overall = [];
  
  let mapped = overall.map(t=>{
    return {
      rank: t.rank || 0,
      team: { name: t.team?.name || 'Team', logo: t.team?.logoUrl || '' },
      points: t.points || 0,
      played: t.played || 0,
      won: t.won || 0,
      drawn: t.drawn || 0,
      lost: t.lost || 0,
      goalsFor: t.goalsFor || 0,
      goalsAgainst: t.goalsAgainst || 0,
      goalDifference: t.goalDifference || 0,
      form: t.form || ''
    };
  });
  
  return new Response(JSON.stringify({ response: mapped }), { 
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
  });
 }catch(e){
  return new Response(JSON.stringify({ response: [], error: e.message }), { headers: { 'Content-Type': 'application/json' } });
 }
}
