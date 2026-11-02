export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let id = url.searchParams.get('id');
  if(!id) return new Response(JSON.stringify({ data: {} }), { headers: { 'Content-Type': 'application/json' } });
  let res = await fetch(`https://api.apisport.online/fixtures?id=${id}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
  let json = await res.json();
  let f = (json.response||json.data||[])[0] || {};
  let mapped = {
    id: f.fixture?.id,
    homeTeam: { name: f.teams?.home?.name || 'Home' },
    awayTeam: { name: f.teams?.away?.name || 'Away' },
    league: { name: f.league?.name },
    state: { score: { current: `${f.goals?.home ?? 0}-${f.goals?.away ?? 0}` }, description: f.fixture?.status?.long || 'FT' }
  };
  return new Response(JSON.stringify({ data: mapped }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
 }catch(e){
  return new Response(JSON.stringify({ data: {} }), { headers: { 'Content-Type': 'application/json' } });
 }
}
