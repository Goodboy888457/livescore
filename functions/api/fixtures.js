export async function onRequestGet(context) {
  const date = new URL(context.request.url).searchParams.get('date') || new Date().toISOString().split('T')[0];
  const KEY = context.env.FOOTBALL_API_KEY || context.env.API_FOOTBALL_KEY;
  
  async function fetchMap(url){
    const r = await fetch(url, { headers:{ "x-apisports-key": KEY }});
    const j = await r.json();
    return (j.response||[]).map(m=>({
      id:String(m.fixture.id), home_team:m.teams.home.name, away_team:m.teams.away.name,
      home_score:m.goals.home, away_score:m.goals.away, status:m.fixture.status.short,
      minute:String(m.fixture.status.elapsed||""), league_name:m.league.name,
      league_zone:m.league.country, datetime:m.fixture.date, kickoff_utc:m.fixture.date
    }));
  }

  let data = await fetchMap(`https://v3.football.api-sports.io/fixtures?date=${date}`);
  
  // DOC SAYS: If date returns 0, try from/to with season OR next/last
  if(data.length===0){
    const year = date.split('-')[0];
    // Try method 2 from docs: from/to + season (required for free)
    data = await fetchMap(`https://v3.football.api-sports.io/fixtures?from=${date}&to=${date}&season=${year}`);
    // Try method 3 from docs: next 50
    if(data.length===0) data = await fetchMap(`https://v3.football.api-sports.io/fixtures?next=20`);
  }

  return new Response(JSON.stringify({ success:true, data, count:data.length, date }), {
    headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "Cache-Control":"public, max-age=60" }
  });
}
