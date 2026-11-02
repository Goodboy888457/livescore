export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let slug = url.searchParams.get('leagueName') || url.searchParams.get('league') || 'premier-league';
  slug = slug.toLowerCase().trim();
  
  let endpoint = `https://api.apisport.online/api/v1/standings?league=${slug}&season=2026/2027`;
  let res = await fetch(endpoint, { headers: { 'x-api-key': apiKey } });
  let json = await res.json();
  
  let overall = json.data?.standings?.Overall || json.data?.standings || [];
  
  return new Response(JSON.stringify({ 
    response: overall.map(t=>({
      rank: t.rank,
      team: { name: t.team?.name, logo: t.team?.logoUrl },
      points: t.points,
      played: t.played,
      goalsFor: t.goalsFor,
      goalsAgainst: t.goalsAgainst,
      goalDifference: t.goalDifference
    }))
  }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
 }catch(e){
  return new Response(JSON.stringify({ response: [], error: e.message }), { headers: { 'Content-Type': 'application/json' } });
 }
}
