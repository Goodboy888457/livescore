export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const leagueId = url.searchParams.get('id');
    const API_KEY = env.SPORTAPI_KEY;

    if (!leagueId || leagueId === 'undefined') {
      return new Response(JSON.stringify({ data: [] }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Try standings endpoint
    const endpoints = [
      `https://sportapi.ai/api/standings/${leagueId}`,
      `https://sportapi.ai/api/football/standings/${leagueId}`,
      `https://sportapi.ai/api/leagues/${leagueId}/standings`
    ];

    for (let ep of endpoints) {
      try {
        const res = await fetch(ep, { headers: { "X-Api-Key": API_KEY } });
        const txt = await res.text();
        if (!txt || txt.trim().startsWith('<')) continue;
        const j = JSON.parse(txt);
        
        // Handle different structures
        let list = j.data || j.standings || j.table || j.groups || j || [];
        
        // If groups (MLS etc), flatten
        if (j.data?.groups) {
          list = j.data.groups.flatMap(g => g.standings || g.table || []);
        } else if (Array.isArray(j.data) && j.data[0]?.groups) {
          list = j.data[0].groups.flatMap(g => g.standings || []);
        }

        // If data is object with standings array inside
        if (!Array.isArray(list) && typeof list === 'object') {
          list = list.standings || list.table || list.rows || [];
        }

        if (Array.isArray(list) && list.length > 0) {
          // Check if it's fake cup table (all wins 0 but played >0)
          const first = list[0];
          const isFakeCup = list.every(t => {
            const w = t.wins ?? t.win ?? t.W ?? 0;
            const mp = t.matches ?? t.played ?? t.MP ?? 0;
            return mp > 0 && w === 0;
          });

          if (isFakeCup) {
            return new Response(JSON.stringify({ data: [], isCup: true }), {
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }

          return new Response(JSON.stringify({ data: list }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      } catch (e) { continue; }
    }

    return new Response(JSON.stringify({ data: [], isCup: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ data: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
