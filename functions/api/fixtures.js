export async function onRequestGet(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const KEY = env.FOOTBALL_API_KEY || env.API_FOOTBALL_KEY || env.API_FOOTBALL || env.FOOTBALL_KEY;

  if (!KEY) {
    return new Response(JSON.stringify({ success:false, error:"Add FOOTBALL_API_KEY in Cloudflare Pages > Settings > Variables", data:[] }), {
      headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }
    });
  }

  const headers = { "x-apisports-key": KEY.trim() };

  async function getRaw(apiUrl){
    try{
      const r = await fetch(apiUrl, { headers });
      const j = await r.json();
      return j.response || [];
    }catch{ return []; }
  }

  function mapData(raw){
    return raw.map(m=>({
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

  try{
    const year = date.split('-')[0];
    let raw = [];

    // 1. DOC METHOD: date param - GET /fixtures?date=YYYY-MM-DD
    raw = await getRaw(`https://v3.football.api-sports.io/fixtures?date=${date}`);

    // 2. DOC METHOD: from/to + season - GET /fixtures?from=&to=&season=
    if(raw.length===0){
      raw = await getRaw(`https://v3.football.api-sports.io/fixtures?from=${date}&to=${date}&season=${year}`);
    }

    // 3. DOC METHOD: next/last + live - ALWAYS RETURNS DATA!
    if(raw.length===0){
      const today = new Date().toISOString().split('T')[0];
      if(date >= today){
        raw = await getRaw(`https://v3.football.api-sports.io/fixtures?next=50`);
      }else{
        raw = await getRaw(`https://v3.football.api-sports.io/fixtures?last=50`);
      }
      if(raw.length===0) raw = await getRaw(`https://v3.football.api-sports.io/fixtures?live=all`);
    }

    const out = mapData(raw);

    return new Response(JSON.stringify({ 
      success:true, 
      data:out, 
      count:out.length, 
      date,
      source: out.length>0 ? "api-football" : "empty",
      note: out.length>0 && !out[0].datetime.startsWith(date) ? `No exact fixtures for ${date}, showing next available ${out.length} matches` : `${out.length} matches for ${date}`
    }), {
      headers:{ 
        "Content-Type":"application/json", 
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"public, max-age=60"
      }
    });

  }catch(e){
    return new Response(JSON.stringify({ success:false, error:e.message, data:[] }), {
      headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }
    });
  }
}
