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

    // List of SportAPI endpoints to try for team history
    const tryEndpoints = [
      `https://sportapi.ai/api/football/team/${team1}/fixtures`,
      `https://sportapi.ai/api/football/team/${team1}/matches`,
      `https://sportapi.ai/api/football/fixtures?team_id=${team1}`,
      `https://sportapi.ai/api/fixtures/team/${team1}`,
      `https://sportapi.ai/api/football/h2h/${team1}/${team2}`,
      `https://sportapi.ai/api/h2h/${team1}/${team2}`
    ];

    for (let ep of tryEndpoints) {
      try {
        const res = await fetch(ep, { headers: { "X-Api-Key": API_KEY } });
        const txt = await res.text();
        if (!txt || txt.trim().startsWith('<') || txt.trim().startsWith('<!DOCTYPE')) continue;
        const j = JSON.parse(txt);
        const list = j.data || j.fixtures || j.matches || j || [];
        if (Array.isArray(list) && list.length > 0) {
          // If this is already H2H endpoint, use it
          if (ep.includes('h2h')) {
            games = list;
            break;
          }
          // Otherwise filter for matches vs team2
          const filtered = list.filter(m => {
            const hId = String(m.home_id || m.homeTeam?.id || m.home_team_id || '');
            const aId = String(m.away_id || m.awayTeam?.id || m.away_team_id || '');
            return hId === String(team2) || aId === String(team2);
          }).filter(m => m.home_score != null || m.score);
          if (filtered.length > 0) {
            games = filtered;
            break;
          }
        }
      } catch (e) { continue; }
    }

    // If still empty, try team2 endpoints
    if (games.length === 0) {
      for (let ep of tryEndpoints.map(u => u.replace(team1, team2))) {
        try {
          const res = await fetch(ep, { headers: { "X-Api-Key": API_KEY } });
          const txt = await res.text();
          if (!txt || txt.trim().startsWith('<')) continue;
          const j = JSON.parse(txt);
          const list = j.data || j.fixtures || j.matches || j || [];
          const filtered = list.filter(m => {
            const hId = String(m.home_id || m.homeTeam?.id || '');
            const aId = String(m.away_id || m.awayTeam?.id || '');
            return hId === String(team1) || aId === String(team1);
          }).filter(m => m.home_score != null);
          if (filtered.length > 0) { games = filtered; break; }
        } catch (e) { continue; }
      }
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
