export async function onRequestGet(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const KEY = env.FOOTBALL_API_KEY || env.API_FOOTBALL_KEY;
  if (!KEY) return new Response(JSON.stringify({ success:false, error:"Add FOOTBALL_API_KEY in Cloudflare", data:[] }), { headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }});
  try {
    const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${date}`, { headers:{ "x-apisports-key": KEY.trim() }});
    if (!res.ok) {
      const t=await res.text();
      return new Response(JSON.stringify({ success:false, error:`API ${res.status}: ${t.slice(0,300)}`, data:[] }), { headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }});
    }
    const json = await res.json();
    const out = (json.response||[]).map(m=>({
      id:String(m.fixture?.id),
      home_team:m.teams?.home?.name||"Home",
      away_team:m.teams?.away?.name||"Away",
      home_score:m.goals?.home??null,
      away_score:m.goals?.away??null,
      status:m.fixture?.status?.short||"NS",
      minute:String(m.fixture?.status?.elapsed||""),
      league_name:m.league?.name||"League",
      league_zone:m.league?.country||"WORLD",
      datetime:m.fixture?.date||date,
      kickoff_utc:m.fixture?.date||date
    }));
    return new Response(JSON.stringify({ success:true, data:out, count:out.length, date }), {
      headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "Cache-Control":"public, max-age=120" }
    });
  } catch(e){
    return new Response(JSON.stringify({ success:false, error:e.message, data:[] }), { headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }});
  }
}
