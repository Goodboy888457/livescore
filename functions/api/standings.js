export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const leagueId = url.searchParams.get('league_id') || url.searchParams.get('id') || "24";
  const API_KEY = env.SPORTAPI_KEY;

  try {
    const res = await fetch(`https://sportapi.ai/api/standings/${leagueId}`, {
      headers: { "X-Api-Key": API_KEY }
    });
    const txt = await res.text();
    const j = JSON.parse(txt);
    return new Response(JSON.stringify({ 
      data: j.data || [],
      groups: j.groups || [],
      league: j.league,
      season: j.season,
      format: j.format
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: [], error: e.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
