export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const team1 = url.searchParams.get('team1');
    const team2 = url.searchParams.get('team2');
    const API_KEY = env.SPORTAPI_KEY;

    if (!team1 || !team2 || team1 === 'undefined' || team2 === 'undefined') {
      return new Response(JSON.stringify({ data: [] }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    let games = [];

    const endpoints = [
      `https://sportapi.ai/api/football/h2h/${team1}/${team2}`,
      `https://sportapi.ai/api/h2h/${team1}/${team2}`,
      `https://sportapi.ai/api/football/team/${team1}/fixtures`,
      `https://sportapi.ai/api/football/fixtures?team_id=${team1}`
    ];

    for (let ep of endpoints) {
      try {
        const res = await fetch(ep, { headers: { "X-Api-Key": API_KEY } });
        const txt = await res.text();
        if (!txt || txt.trim().startsWith('<') || txt.trim().startsWith('<!DOCTYPE')) continue;
        const j = JSON.parse(txt);
        const list = j.data || j.fixtures || j.matches || j || [];
        if (Array.isArray(list) && list.length > 0) {
          if (ep.includes('h2h')) { games = list; break; }
          const filtered = list.filter(m => {
            const hId = String(m.home_id || m.homeTeam?.id || m.home_team_id || '');
            const aId = String(m.away_id || m.awayTeam?.id || m.away_team_id || '');
            return hId === String(team2) || aId === String(team2);
          }).filter(m => m.home_score != null || m.score);
          if (filtered.length > 0) { games = filtered; break; }
        }
      } catch (e) { continue; }
    }

    return new Response(JSON.stringify({ data: games.slice(0, 5) }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ data: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
