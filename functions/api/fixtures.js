export async function onRequestGet(context) {
  const request = context.request;
  const env = context.env;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  // ONLY FOOTBALL_API_KEY - NO HIGHLIGHTLY!
  const FOOTBALL_KEY = env.FOOTBALL_API_KEY || env.API_FOOTBALL_KEY || env.API_FOOTBALL || env.FOOTBALL_KEY;

  if (!FOOTBALL_KEY) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Missing FOOTBALL_API_KEY! Add it in Cloudflare Pages > Settings > Variables", 
      data: [] 
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${date}`;
    const res = await fetch(apiUrl, {
      headers: { "x-apisports-key": FOOTBALL_KEY.trim() }
    });
    
    if (!res.ok) {
      const txt = await res.text();
      return new Response(JSON.stringify({ 
        success: false, 
        error: `API-Football ${res.status}: ${txt.slice(0,500)}`,
        hint: res.status===429 ? "100/day limit reached! Wait tomorrow" : res.status===403 ? "Key invalid" : "",
        data: [] 
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    const json = await res.json();
    const raw = json.response || [];

    const out = raw.map(m => ({
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

    return new Response(JSON.stringify({ 
      success: true, 
      data: out, 
      count: out.length, 
      date, 
      source: "api-football-only",
      key_used: "YES",
      remaining: res.headers.get('x-ratelimit-requests-remaining') || 'unknown'
    }), {
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=120"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, data: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
