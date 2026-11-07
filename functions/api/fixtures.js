export async function onRequestGet(context) {
  const request = context.request;
  const env = context.env;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  
  // Support ALL variable names you might use
  const FOOTBALL_KEY = env.FOOTBALL_API_KEY || env.API_FOOTBALL_KEY || env.API_FOOTBALL || env.FOOTBALL_KEY;
  const SPORTS_KEY = env.SPORTS_API_KEY;
  const HIGHLIGHTLY_KEY = env.HIGHLIGHTLY_API_KEY;

  if (!FOOTBALL_KEY && !SPORTS_KEY && !HIGHLIGHTLY_KEY) {
    return new Response(JSON.stringify({ success: false, error: "No API key! Add FOOTBALL_API_KEY", data: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    let out = [];

    if (FOOTBALL_KEY) {
      // API-FOOTBALL.COM - BEST! 100/day
      const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${date}`;
      const res = await fetch(apiUrl, {
        headers: { "x-apisports-key": FOOTBALL_KEY }
      });
      
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API-Football ${res.status}: ${txt.slice(0,400)}`);
      }
      
      const json = await res.json();
      const raw = json.response || [];

      out = raw.map(m => {
        let home = m.teams?.home?.name || "Home";
        let away = m.teams?.away?.name || "Away";
        let leagueName = m.league?.name || "League";
        let country = m.league?.country || "WORLD";
        let status = m.fixture?.status?.short || "NS";
        let minute = m.fixture?.status?.elapsed || "";

        return {
          id: String(m.fixture?.id),
          home_team: home,
          away_team: away,
          home_score: m.goals?.home ?? null,
          away_score: m.goals?.away ?? null,
          status: status,
          minute: String(minute),
          league_name: leagueName,
          league_zone: country,
          datetime: m.fixture?.date || date,
          kickoff_utc: m.fixture?.date || date
        };
      });

    } else if (SPORTS_KEY) {
      const apiUrl = `https://sportapi.ai/api/fixtures/date/${date}`;
      const res = await fetch(apiUrl, { headers: { "X-Api-Key": SPORTS_KEY } });
      const json = await res.json();
      const raw = json.data || [];
      out = raw.map(m => ({
        id: String(m.id),
        home_team: m.home_team || "Home",
        away_team: m.away_team || "Away",
        home_score: m.home_score ?? null,
        away_score: m.away_score ?? null,
        status: (m.status || "NS").toUpperCase(),
        minute: String(m.minute || ""),
        league_name: m.league?.name || "League",
        league_zone: m.league?.country || "WORLD",
        datetime: m.date || date,
        kickoff_utc: m.date || date
      }));
    } else {
      const apiUrl = `https://sports.highlightly.net/football/matches?date=${date}`;
      const res = await fetch(apiUrl, { headers: { "x-rapidapi-key": HIGHLIGHTLY_KEY } });
      const json = await res.json();
      const raw = json.data || [];
      out = raw.map(m => ({
        id: String(m.id),
        home_team: m.homeTeam?.name || "Home",
        away_team: m.awayTeam?.name || "Away",
        home_score: m.homeTeam?.score ?? null,
        away_score: m.awayTeam?.score ?? null,
        status: (m.status || "NS").toUpperCase(),
        minute: String(m.minute || ""),
        league_name: m.league?.name || "League",
        league_zone: m.league?.country || "WORLD",
        datetime: m.date || date,
        kickoff_utc: m.date || date
      }));
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: out, 
      count: out.length, 
      date, 
      source: FOOTBALL_KEY ? "api-football (FOOTBALL_API_KEY)" : "fallback",
      key_used: FOOTBALL_KEY ? "YES" : "NO"
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
