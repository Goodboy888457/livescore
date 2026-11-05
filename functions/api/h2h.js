export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const team1 = url.searchParams.get('team1');
    const team2 = url.searchParams.get('team2');
    const team1Name = url.searchParams.get('team1Name') || '';
    const team2Name = url.searchParams.get('team2Name') || '';
    const API_KEY = env.SPORTAPI_KEY;

    if (!API_KEY) return new Response(JSON.stringify({ data: [] }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

    let allGames = [];

    // Try to get matches for team1 from SportAPI directly (history, not just today)
    const endpointsToTry = [
      `https://sportapi.ai/api/football/team/${team1}/matches`,
      `https://sportapi.ai/api/football/matches?team_id=${team1}`,
      `https://sportapi.ai/api/fixtures/team/${team1}`,
      `https://sportapi.ai/api/football/fixtures?team_id=${team1}&limit=100`,
      `https://sportapi.ai/api/football/h2h/${team1}/${team2}`
    ];

    for (let ep of endpointsToTry) {
      try {
        const r = await fetch(ep, { headers: { "X-Api-Key": API_KEY } });
        const text = await r.text();
        if (!text || text.startsWith('<')) continue;
        const j = JSON.parse(text);
        const list = j.data || j.matches || j.fixtures || j || [];
        if (Array.isArray(list) && list.length > 0) {
          // Filter for games vs team2 if possible
          let filtered = list.filter(m => {
            let hId = String(m.home_id || m.homeTeam?.id || m.home_team_id || '');
            let aId = String(m.away_id || m.awayTeam?.id || m.away_team_id || '');
            let ht = (m.home_team || m.homeTeam?.name || '').toLowerCase();
            let at = (m.away_team || m.awayTeam?.name || '').toLowerCase();
            // Match by ID or by name
            return (hId === String(team2) || aId === String(team2)) ||
                   (team2Name && (ht.includes(team2Name.toLowerCase()) || at.includes(team2Name.toLowerCase())));
          });
          if (filtered.length > 0) {
            allGames = filtered;
            break;
          }
          // If filtering gave nothing but list has games, use list if it looks like H2H
          if (ep.includes('h2h') && list.length > 0) {
            allGames = list;
            break;
          }
        }
      } catch (e) { continue; }
    }

    // If still empty, try team2
    if (allGames.length === 0) {
      for (let ep of endpointsToTry.map(u => u.replace(team1, team2))) {
        try {
          const r = await fetch(ep, { headers: { "X-Api-Key": API_KEY } });
          const text = await r.text();
          if (!text || text.startsWith('<')) continue;
          const j = JSON.parse(text);
          const list = j.data || j.matches || j.fixtures || j || [];
          if (Array.isArray(list) && list.length > 0) {
            let filtered = list.filter(m => {
              let hId = String(m.home_id || m.homeTeam?.id || '');
              let aId = String(m.away_id || m.awayTeam?.id || '');
              return hId === String(team1) || aId === String(team1);
            });
            if (filtered.length > 0) { allGames = filtered; break; }
          }
        } catch (e) { continue; }
      }
    }

    // Final fallback: return whatever we found (max 5, finished only)
    let finished = allGames.filter(m => m.home_score != null || m.homeScore != null || m.score).slice(0, 5);

    return new Response(JSON.stringify({ data: finished }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ data: [], error: e.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
