export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let input = url.searchParams.get('leagueName') || url.searchParams.get('league') || 'premier-league';
  
  // Auto convert ANY name to slug: "AFC Champions League Elite" -> "afc-champions-league-elite"
  let slug = input.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g,'') // remove special chars
    .replace(/\s+/g,'-') // spaces to -
    .replace(/-+/g,'-'); // double -- to -
  
  // Fix common short names
  const fixes = {
    'premier-league': 'premier-league',
    'epl': 'premier-league',
    'laliga': 'laliga',
    'la-liga': 'laliga',
    'bundesliga': 'bundesliga',
    'serie-a': 'serie-a',
    'ligue-1': 'ligue-1',
    'champions-league': 'uefa-champions-league',
    'afc-champions-league-elite': 'afc-champions-league',
    'afc-champions-league': 'afc-champions-league',
    'jamaica-premier-league': 'premier-league-jm',
    'liga-mx-apertura': 'liga-mx-apertura'
  };
  if(fixes[slug]) slug = fixes[slug];
  
  let endpoint = `https://api.apisport.online/api/v1/standings?league=${slug}&season=2026/2027`;
  
  let res = await fetch(endpoint, { headers: { 'x-api-key': apiKey } });
  let json = await res.json();
  
  // No table for this league? Try without season
  if(!json.data?.standings?.Overall?.length){
    let retry = `https://api.apisport.online/api/v1/standings?league=${slug}`;
    let res2 = await fetch(retry, { headers: { 'x-api-key': apiKey } });
    json = await res2.json();
  }
  
  let overall = json.data?.standings?.Overall || json.data?.standings || [];
  
  return new Response(JSON.stringify({ 
    response: overall.map(t=>({
      rank: t.rank,
      team: { name: t.team?.name, logo: t.team?.logoUrl },
      points: t.points,
      played: t.played,
      goalsFor: t.goalsFor,
      goalsAgainst: t.goalsAgainst,
      goalDifference: t.goalDifference,
      form: t.form
    })),
    league: slug,
    success: overall.length > 0
  }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
 }catch(e){
  return new Response(JSON.stringify({ response: [], error: e.message }), { headers: { 'Content-Type': 'application/json' } });
 }
}
