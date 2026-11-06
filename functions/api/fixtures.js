export async function onRequestGet(context){
 const {request, env} = context;
 const url = new URL(request.url);
 const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
 const KEY = env.HIGHLIGHTLY_API_KEY || env.HIGHLIGHTLY_KEY || env.API_KEY;

 if(!KEY){
   return new Response(JSON.stringify({
     success:false, 
     error:"No data - check HIGHLIGHTLY_API_KEY. Go Cloudflare Pages > Settings > Environment variables > Add HIGHLIGHTLY_API_KEY",
     data:[]
   }),{
     status:200, 
     headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
   });
 }

 try{
  // CORRECT Highlightly endpoint
  const apiUrl = `https://sports.highlightly.net/football/fixtures?date=${date}`;
  const r = await fetch(apiUrl, {
    headers:{
      "x-api-key": KEY,
      "x-rapidapi-key": KEY,
      "Authorization": `Bearer ${KEY}`
    }
  });
  const text = await r.text();
  let j={};
  try{ j=JSON.parse(text); }catch(e){ j={raw:text}; }
  
  let raw = j.data || j.fixtures || j.results || [];
  if(!Array.isArray(raw) && j.fixtures && typeof j.fixtures === 'object') raw = Object.values(j.fixtures).flat();
  if(!Array.isArray(raw)) raw = [];

  if(raw.length===0){
    // Try alternative endpoint format
    const r2 = await fetch(`https://api.highlightly.net/football/fixtures/date/${date}`, {
      headers:{"x-api-key":KEY, "x-rapidapi-key":KEY}
    });
    const j2 = await r2.json().catch(()=>({}));
    raw = j2.data || j2.fixtures || [];
  }

  const out = raw.map(f=>({
    id: f.id || f.fixture_id || f.match_id || String(Math.random()),
    home_team: f.home_team?.name || f.homeTeam?.name || f.teams?.home?.name || f.home_team || 'Home',
    away_team: f.away_team?.name || f.awayTeam?.name || f.teams?.away?.name || f.away_team || 'Away',
    home_score: f.home_score ?? f.goals?.home ?? f.score?.home ?? null,
    away_score: f.away_score ?? f.goals?.away ?? f.score?.away ?? null,
    status: (f.status?.short || f.status || f.state || 'NS').toUpperCase(),
    minute: f.status?.elapsed || f.minute || '',
    league_name: f.league?.name || f.league_name || f.competition?.name || 'League',
    league_zone: f.league?.country || f.country?.name || f.zone || f.league_zone || 'WORLD',
    league_id: f.league?.id || '0',
    datetime: f.kickoff || f.fixture?.date || f.date || date,
    kickoff_utc: f.kickoff || f.fixture?.date || f.date
  }));

  return new Response(JSON.stringify({success:true,data:out,total:out.length}),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Cache-Control":"no-cache"}
  });

 }catch(err){
  return new Response(JSON.stringify({success:false,error:err.message,data:[]}),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
 }
}
