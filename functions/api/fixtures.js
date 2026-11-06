export async function onRequestGet(context) {
  const request = context.request;
  const env = context.env;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const KEY = env.HIGHLIGHTLY_API_KEY;

  if (!KEY) {
    return new Response(JSON.stringify({ success: false, error: "Missing HIGHLIGHTLY_API_KEY", data: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    // DOCS: https://sports.highlightly.net/{sport}/matches?date=YYYY-MM-DD
    const apiUrl = `https://sports.highlightly.net/football/matches?date=${date}`;
    const res = await fetch(apiUrl, {
      headers: {
        "x-rapidapi-key": KEY // DOCS says this header only for Highlightly base URL
      }
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch {
      return new Response(JSON.stringify({ success: false, error: text.slice(0, 400), data: [] }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // DOCS: Payload is { data: [...] } 
    let raw = json.data || json.matches || [];
    if (!Array.isArray(raw)) raw = [];

    // TEAM FIX - To separate Wales Premier from England Premier
    const WELSH = ["CONNAH","FLINT","TREFELIN","COLWYN","PENYBONT","CAERNARFON","LLANDUDNO","NEW SAINTS","TNS","HOLYWELL","AIRBUS","HAVERFORDWEST","CARDIFF MET","CAMBRIAN","BARRY","BRITON FERRY","BALA TOWN","NEWTOWN"];
    const ENGLISH = ["EVERTON","COVENTRY","ARSENAL","MAN CITY","LIVERPOOL","CHELSEA","TOTTENHAM","NEWCASTLE","WEST HAM","ASTON VILLA","BRIGHTON","BRENTFORD","FULHAM","WOLVES","PALACE","NOTTINGHAM","BOURNEMOUTH"];

    function fixCountry(c, name, home, away){
      let teams = (home+" "+away).toUpperCase();
      for(let w of WELSH) if(teams.includes(w)) return "Wales";
      for(let e of ENGLISH) if(teams.includes(e)) return "England";
      if(c && c!=="WORLD") return c;
      if(name.toUpperCase().includes("CYMRU")) return "Wales";
      return c || "WORLD";
    }

    const out = raw.map(m => {
      let home = m.homeTeam?.name || "Home";
      let away = m.awayTeam?.name || "Away";
      let leagueName = m.league?.name || "League";
      let country = m.league?.country || "WORLD";
      let realCountry = fixCountry(country, leagueName, home, away);
      
      if(realCountry==="Wales" && leagueName.toUpperCase().includes("PREMIER LEAGUE")) leagueName = "Cymru Premier";
      
      return {
        id: String(m.id),
        home_team: home,
        away_team: away,
        home_score: m.homeTeam?.score ?? null,
        away_score: m.awayTeam?.score ?? null,
        status: (m.status || "NS").toUpperCase(),
        minute: String(m.minute || ""),
        league_name: leagueName,
        league_zone: realCountry,
        datetime: m.date || date,
        kickoff_utc: m.date || date
      };
    }).filter(x => x.id);

    return new Response(JSON.stringify({ success: true, data: out, count: out.length, date }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, data: [] }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
