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
    const apiUrl = `https://sports.highlightly.net/football/matches?date=${date}`;
    const res = await fetch(apiUrl, { headers: { "x-rapidapi-key": KEY } });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch {
      return new Response(JSON.stringify({ success: false, error: text.slice(0,400), data: [] }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    let raw = json.data || json.matches || [];
    if (!Array.isArray(raw)) raw = [];

    const WELSH_TEAMS = ["CONNAH","FLINT","TREFELIN","COLWYN","PENYBONT","CAERNARFON","LLANDUDNO","NEW SAINTS","TNS","HOLYWELL","AIRBUS","HAVERFORDWEST","CARDIFF MET","CAMBRIAN","BARRY","BRITON FERRY","BALA TOWN","NEWTOWN","ABERYSTWYTH"];

    function cleanLeague(originalName, home, away) {
      let name = originalName || "League";
      let teams = (home+" "+away).toUpperCase();
      let L = name.toUpperCase();
      let combined = teams + " " + L;

      let isU21 = combined.includes("U21") || combined.includes("U-21") || L.includes("PL2") || L.includes("PREMIER LEAGUE 2");
      let isU19 = combined.includes("U19") || combined.includes("U-19");
      let isU18 = combined.includes("U18") || combined.includes("U-18");
      let isU23 = combined.includes("U23") || combined.includes("U-23");
      let isAcademy = L.includes("ACADEMY") || L.includes("DEVELOPMENT");
      let isWomen = combined.includes("WOMEN") || L.includes("WSL") || L.includes("FEMENINA") || L.includes("FRAUEN") || L.includes("FEMININE");

      if (isU21) {
        if (L.includes("PREMIER LEAGUE")) return "Premier League 2";
        return name.includes("U21") ? name : name + " U21";
      }
      if (isU19) {
        if (L.includes("YOUTH LEAGUE")) return "UEFA Youth League";
        return name.includes("U19") ? name : name + " U19";
      }
      if (isU18) return "U18 Premier League";
      if (isU23) return name + " U23";
      if (isAcademy) return name + " (Academy)";
      if (isWomen) return name.includes("Women") ? name : name + " (Women)";

      if (L.includes("CYMRU") || WELSH_TEAMS.some(w => combined.includes(w))) {
        if (L.includes("PREMIER LEAGUE")) return "Cymru Premier";
      }
      return name;
    }

    function fixCountry(originalCountry, originalName, home, away) {
      let teams = (home+" "+away).toUpperCase();
      let L = (originalName||"").toUpperCase();
      for(let w of WELSH_TEAMS){ if(teams.includes(w)) return "Wales"; }
      if(originalCountry && originalCountry!=="WORLD" && originalCountry!=="World") return originalCountry;
      if(L.includes("CYMRU")) return "Wales";
      if(L.includes("CHAMPIONS LEAGUE") || L.includes("EUROPA") || L.includes("YOUTH LEAGUE")) return "Europe";
      return originalCountry || "WORLD";
    }

    const out = raw.map(m => {
      let home = m.homeTeam?.name || "Home";
      let away = m.awayTeam?.name || "Away";
      let leagueName = m.league?.name || "League";
      let country = m.league?.country || "WORLD";

      let realCountry = fixCountry(country, leagueName, home, away);
      let cleanName = cleanLeague(leagueName, home, away);

      if(realCountry==="Wales" && cleanName.toUpperCase().includes("PREMIER LEAGUE") && !cleanName.includes("2")){
        cleanName = "Cymru Premier";
      }

      return {
        id: String(m.id),
        home_team: home,
        away_team: away,
        home_score: m.homeTeam?.score ?? null,
        away_score: m.awayTeam?.score ?? null,
        status: (m.status || "NS").toUpperCase(),
        minute: String(m.minute || ""),
        league_name: cleanName,
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
