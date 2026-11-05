export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const team1 = url.searchParams.get('team1');
  const team2 = url.searchParams.get('team2');
  const API_KEY = env.SPORTAPI_KEY;

  if (!team1 || !team2 || team1 === 'undefined' || team2 === 'undefined') {
    return new Response(JSON.stringify({ data: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    // Official endpoint from docs: /api/fixtures/h2h/{team1}/{team2}
    const res = await fetch(`https://sportapi.ai/api/fixtures/h2h/${team1}/${team2}`, {
      headers: { "X-Api-Key": API_KEY }
    });
    
    const txt = await res.text();
    if (!txt || txt.trim().startsWith('<')) {
      return new Response(JSON.stringify({ data: [] }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const j = JSON.parse(txt);
    // Docs: { success:true, team1:311, team2:312, data:[...] }
    const list = j.data || [];
    
    return new Response(JSON.stringify({ data: list }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ data: [], error: e.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
