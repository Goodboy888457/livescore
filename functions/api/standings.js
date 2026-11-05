export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const leagueId = url.searchParams.get('id') || "24";
  const API_KEY = env.SPORTAPI_KEY;

  try {
    // Official endpoint from docs: /api/standings/{leagueId}
    // Can be ID or slug: 24 or premier-league
    const res = await fetch(`https://sportapi.ai/api/standings/${leagueId}`, {
      headers: { "X-Api-Key": API_KEY }
    });
    
    const txt = await res.text();
    
    if (!txt || txt.trim().startsWith('<')) {
      return new Response(JSON.stringify({ 
        data: [], 
        error: "API returned HTML",
        leagueId: leagueId,
        raw: txt.slice(0,200)
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const j = JSON.parse(txt);
    
    // Docs: { success:true, league:{}, season:"2026/27", format:"league", data:[...] }
    // format "cup" = cup, knockout cup = empty table
    let list = j.data || [];
    
    if (j.format === "cup" && list.length === 0) {
      return new Response(JSON.stringify({ 
        data: [], 
        isCup: true, 
        format: j.format,
        league: j.league 
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response(JSON.stringify({ 
      data: list,
      league: j.league,
      season: j.season,
      format: j.format,
      success: j.success
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ 
      data: [], 
      error: e.message,
      leagueId: leagueId
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
