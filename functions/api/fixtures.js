export async function onRequestGet(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const KEY = env.FOOTBALL_API_KEY || env.API_FOOTBALL_KEY || env.API_FOOTBALL || env.FOOTBALL_KEY || env.API_KEY;

  if (!KEY) {
    return new Response(JSON.stringify({ success:false, error:"Missing FOOTBALL_API_KEY - Add am for Cloudflare Pages > Settings > Variables", data:[] }), {
      headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }
    });
  }

  const H = { "x-apisports-key": KEY.trim() };

  async function getRaw(u){
    try{
      const r = await fetch(u, { headers:H });
      const j = await r.json();
      // console log for debugging
      return j.response || [];
    }catch(e){ return []; }
  }

  function mapIt(raw){
    return raw.map(m=>({
      id: String(m.fixture?.id),
      home_team: m.teams?.home?.name || "Home",
      away_team: m.teams?.away?.name || "Away",
      home_score: m.goals?.home ?? null,
      away_score: m.goals?.away ?? null,
      status: m.fixture?.status?.short || "NS",
      minute: String(m.fixture?.status?.elapsed || ""),
      league_name: m.league?.name || "League",
      league_zone: m.league?.country || "WORLD",
      datetime: m.fixture?.date || date,
      kickoff_utc: m.fixture?.date || date
    }));
  }

  try{
    const today = new Date().toISOString().split('T')[0];
    const year = date.split('-')[0];
    let raw = [];

    // STEP 1 - Official doc: ?date=YYYY-MM-DD (works for Today)
    raw = await getRaw(`https://v3.football.api-sports.io/fixtures?date=${date}`);

    // STEP 2 - Official doc: ?from=&to=&season= (required for free plan)
    if(raw.length===0){
      raw = await getRaw(`https://v3.football.api-sports.io/fixtures?from=${date}&to=${date}&season=${year}`);
    }

    // STEP 3 - Official doc fallback: next/last/live - THIS MAKES TOMORROW NEVER EMPTY!
    if(raw.length===0){
      if(date >= today){
        // Tomorrow or Today - get NEXT 50 upcoming fixtures - ALWAYS returns data!
        raw = await getRaw(`https://v3.football.api-sports.io/fixtures?next=50`);
        if(raw.length===0){
          raw = await getRaw(`https://v3.football.api-sports.io/fixtures?live=all`);
        }
      }else{
        // Yesterday - get LAST 50 finished fixtures
        raw = await getRaw(`https://v3.football.api-sports.io/fixtures?last=50`);
        if(raw.length===0){
          raw = await getRaw(`https://v3.football.api-sports.io/fixtures?from=${date}&to=${date}&season=${year}`);
        }
      }
    }

    const out = mapIt(raw);

    return new Response(JSON.stringify({
      success:true,
      data: out,
      count: out.length,
      date: date,
      isFallback: out.length>0 && !out[0].datetime.startsWith(date),
      message: out.length>0 && !out[0].datetime.startsWith(date) 
        ? `No exact fixtures for ${date} in API database, showing next ${out.length} available matches` 
        : `${out.length} matches found for ${date}`
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
