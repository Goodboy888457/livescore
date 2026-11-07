export async function onRequestGet(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const KEY = env.FOOTBALL_API_KEY || env.API_FOOTBALL_KEY || env.API_FOOTBALL;
  
  if (!KEY) return new Response(JSON.stringify({ success:false, error:"Add FOOTBALL_API_KEY", data:[] }), { headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }});

  async function fetchAndMap(apiUrl){
    const res = await fetch(apiUrl, { headers:{ "x-apisports-key": KEY.trim() }});
    if(!res.ok) return [];
    const json = await res.json();
    return (json.response||[]).map(m=>({
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
  }

  try {
    let out = [];
    
    // 1. Try normal date fetch
    out = await fetchAndMap(`https://v3.football.api-sports.io/fixtures?date=${date}`);
    
    // 2. If Tomorrow/Yesterday returns 0, try next/last fallback to FORCE fixtures
    if(out.length===0){
      const today = new Date().toISOString().split('T')[0];
      if(date > today){ // Future = Tomorrow
        out = await fetchAndMap(`https://v3.football.api-sports.io/fixtures?next=50`);
        // Filter only tomorrow's date from next 50
        out = out.filter(m=>m.datetime.startsWith(date));
        if(out.length===0) out = await fetchAndMap(`https://v3.football.api-sports.io/fixtures?from=${date}&to=${date}`);
      } else if(date < today){ // Past = Yesterday
        out = await fetchAndMap(`https://v3.football.api-sports.io/fixtures?last=50`);
        out = out.filter(m=>m.datetime.startsWith(date));
        if(out.length===0) out = await fetchAndMap(`https://v3.football.api-sports.io/fixtures?from=${date}&to=${date}`);
      }
    }

    return new Response(JSON.stringify({ success:true, data:out, count:out.length, date, source:"api-football-fixed" }), {
      headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "Cache-Control":"public, max-age=60" }
    });
  } catch(e){
    return new Response(JSON.stringify({ success:false, error:e.message, data:[] }), { headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }});
  }
}
