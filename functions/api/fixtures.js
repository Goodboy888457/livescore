export async function onRequestGet(context) {
  const request = context.request;
  const env = context.env;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const KEY = env.HIGHLIGHTLY_API_KEY;

  if (!KEY) {
    return new Response(JSON.stringify({ success: false, error: "Missing KEY", data: [] }), {
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

    // TEAM TO COUNTRY FOR ALL LEAGUES - FIX WORLD PROBLEM!
    const TEAM_COUNTRY = {
      "Wales": ["CONNAH","FLINT","TREFELIN","COLWYN","PENYBONT","CAERNARFON","LLANDUDNO","NEW SAINTS","TNS","HOLYWELL","AIRBUS","HAVERFORDWEST","CARDIFF MET","CAMBRIAN","BARRY","BRITON FERRY","BALA TOWN","NEWTOWN","ABERYSTWYTH"],
      "Malta": ["BIRZEBBUGA","MOSTA","VALLETTA","HIBERNIANS","FLORIANA","GZIRA","BALZAN","SIRENS","MARSAXLOKK","SLIEMA","BIRKIRKARA","NAXXAR"],
      "France": ["TOULOUSE","STRASBOURG","PSG","MARSEILLE","LYON","LILLE","MONACO","NICE","RENNES","LENS","BREST","NANTES","MONTPELLIER","LE HAVRE","AUXERRE","ANGERS","SAINT-ETIENNE"],
      "Germany": ["HAMBURGER","BORUSSIA","MÖNCHENGLADBACH","BAYERN","DORTMUND","LEVERKUSEN","STUTTGART","LEIPZIG","FRANKFURT","WOLFSBURG","BREMEN","FREIBURG","AUGSBURG","HOFFENHEIM","UNION BERLIN"],
      "Austria": ["RAPID WIEN","WOLFSBERGER","AUSTRIA WIEN","SALZBURG","STURM GRAZ","LASK","HARTBERG","KLAGENFURT","WATTENS","ALTACH"],
      "Brazil": ["VITORIA","FLUMINENSE","FLAMENGO","PALMEIRAS","CORINTHIANS","SAO PAULO","BOTAFOGO","GREMIO","INTERNACIONAL","ATLETICO MG","CRUZEIRO","BAHIA","VASCO"],
      "Italy": ["JUVENTUS","INTER","AC MILAN","NAPOLI","ROMA","LAZIO","ATALANTA","FIORENTINA","BOLOGNA","TORINO","UDINESE","EMPOLI","GENOA","VERONA","LECCE","CAGLIARI"],
      "England": ["EVERTON","COVENTRY","ARSENAL","MAN CITY","LIVERPOOL","CHELSEA","TOTTENHAM","NEWCASTLE","WEST HAM","ASTON VILLA","BRIGHTON","FULHAM","WOLVES","PALACE","NOTTINGHAM","SUNDERLAND","BLACKBURN","STOKE","FULHAM","READING","NOTTINGHAM FOREST","LEICESTER","BRENTFORD"],
      "Spain": ["REAL MADRID","BARCELONA","ATLETICO MADRID","SEVILLA","VILLARREAL","REAL SOCIEDAD","BETIS","VALENCIA","ATHLETIC BILBAO","OSASUNA","CELTA","GIRONA","MALLORCA","RAYO","GETAFE","ALAVES","LAS PALMAS"],
      "Netherlands": ["AJAX","PSV","FEYENOORD","AZ ALKMAAR","TWENTE","UTRECHT","HEERENVEEN","NEC","GO AHEAD","SPARTA","WILLEM II","GRONINGEN","HERACLES"]
    };

    function detectCountryFromTeams(home, away, leagueName) {
      let combined = (home+" "+away+" "+leagueName).toUpperCase();
      for (let country in TEAM_COUNTRY) {
        for (let team of TEAM_COUNTRY[country]) {
          if (combined.includes(team)) return country;
        }
      }
      // League name fallback for WORLD
      let L = leagueName.toUpperCase();
      if (L.includes("LIGUE 1") || L.includes("LIGUE 2")) return "France";
      if (L.includes("BUNDESLIGA") && !L.includes("AUSTRIAN")) return "Germany";
      if (L.includes("AUSTRIAN BUNDESLIGA") || L.includes("RAPID WIEN")) return "Austria";
      if (L.includes("EREDIVISIE")) return "Netherlands";
      if (L.includes("LA LIGA") || L.includes("LALIGA")) return "Spain";
      if (L.includes("SERIE A") && (combined.includes("FLUMINENSE") || combined.includes("VITORIA"))) return "Brazil";
      if (L.includes("SERIE A")) return "Italy";
      if (L.includes("PREMIER LEAGUE") && combined.includes("BIRZEBBUGA")) return "Malta";
      if (L.includes("PREMIER LEAGUE") && combined.includes("EVERTON")) return "England";
      if (L.includes("CYMRU")) return "Wales";
      if (L.includes("CHAMPIONS LEAGUE") || L.includes("EUROPA") || L.includes("YOUTH LEAGUE")) return "Europe";
      return null;
    }

    function cleanLeague(originalName, home, away, country) {
      let name = originalName || "League";
      let L = name.toUpperCase();
      let teams = (home+" "+away).toUpperCase();
      let combined = teams + " " + L;

      let isU21 = combined.includes("U21") || combined.includes("U-21") || L.includes("PL2") || L.includes("PREMIER LEAGUE 2");
      let isU19 = combined.includes("U19") || combined.includes("U-19");
      let isU18 = combined.includes("U18");
      let isU23 = combined.includes("U23");
      let isWomen = combined.includes("WOMEN") || L.includes("WSL") || L.includes("FEMENINA");

      if (isU21) {
        if (L.includes("PREMIER LEAGUE") && country==="England") return "Premier League 2";
        return name.includes("U21") ? name : name + " U21";
      }
      if (isU19) return name.includes("U19") ? name : name + " U19";
      if (isU18) return "U18 Premier League";
      if (isU23) return name + " U23";
      if (isWomen) return name.includes("Women") ? name : name + " (Women)";
      if (country==="Wales" && L.includes("PREMIER LEAGUE")) return "Cymru Premier";
      return name;
    }

    const out = raw.map(m => {
      let home = m.homeTeam?.name || "Home";
      let away = m.awayTeam?.name || "Away";
      let leagueName = m.league?.name || "League";
      let country = m.league?.country || "WORLD";

      // 1. FIX WORLD FOR ALL COUNTRIES
      let detected = detectCountryFromTeams(home, away, leagueName);
      if (detected) country = detected;
      else if (country==="WORLD" || country==="World") {
        // Keep as WORLD if not detected - will show flag later
      }

      // 2. FIX MALTA vs ENGLAND SAME NAME PROBLEM
      // Make unique league name for Malta
      if (country==="Malta" && leagueName.toUpperCase().includes("PREMIER LEAGUE")) {
        leagueName = "Maltese Premier League";
      }
      if (country==="Brazil" && leagueName.toUpperCase().includes("SERIE A")) {
        leagueName = "Brasileiro Serie A";
      }

      let cleanName = cleanLeague(leagueName, home, away, country);

      return {
        id: String(m.id),
        home_team: home,
        away_team: away,
        home_score: m.homeTeam?.score ?? null,
        away_score: m.awayTeam?.score ?? null,
        status: (m.status || "NS").toUpperCase(),
        minute: String(m.minute || ""),
        league_name: cleanName,
        league_zone: country,
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
