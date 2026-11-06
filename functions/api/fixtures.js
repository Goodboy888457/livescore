export async function onRequestGet(context) {
  const request = context.request;
  const env = context.env;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const KEY = env.HIGHLIGHTLY_API_KEY;

  if (!KEY) {
    return new Response(JSON.stringify({
      success: false,
      error: "Missing HIGHLIGHTLY_API_KEY in Cloudflare",
      data: []
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  try {
    const apiUrl = "https://sports.highlightly.net/football/matches?date=" + date;
    const res = await fetch(apiUrl, {
      headers: {
        "x-rapidapi-key": KEY
      }
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        error: "Highlightly returned: " + text.substring(0, 300),
        data: []
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    let raw = json.data || json.matches || json || [];
    if (!Array.isArray(raw)) raw = [];

    const out = raw.map((m) => {
      return {
        id: String(m.id || ""),
        home_team: (m.homeTeam && m.homeTeam.name) || "Home",
        away_team: (m.awayTeam && m.awayTeam.name) || "Away",
        home_score: m.homeTeam ? m.homeTeam.score : null,
        away_score: m.awayTeam ? m.awayTeam.score : null,
        status: (m.status || "NS").toUpperCase(),
        minute: String(m.minute || ""),
        league_name: (m.league && m.league.name) || "League",
        league_zone: (m.league && m.league.country) || "WORLD",
        datetime: m.date || date,
        kickoff_utc: m.date || date
      };
    }).filter((x) => x.id);

    return new Response(JSON.stringify({
      success: true,
      data: out,
      count: out.length,
      source: "highlightly",
      date: date
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message,
      data: []
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
