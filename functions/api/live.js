export async function onRequestGet(context){
 const {request, env} = context;
 const KEY = env.HIGHLIGHTLY_API_KEY || env.HIGHLIGHTLY_KEY;

 if(!KEY){
   return new Response(JSON.stringify({success:false,error:"HIGHLIGHTLY_API_KEY missing"}),{
     status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
   });
 }

 try{
  // Highlightly LIVE endpoint
  const apiUrl = `https://sports.highlightly.net/football/fixtures/live`;
  const r = await fetch(apiUrl, {headers:{"x-api-key":KEY}});
  const j = await r.json();

  let raw = j.data || j.fixtures || j.live || j || [];
  if(!Array.isArray(raw)) raw=[];

  const out = raw.map(f=>({
    id:f.id||f.fixture_id,
    home_team:f.home_team?.name||f.home_team||f.teams?.home?.name||'Home',
    away_team:f.away_team?.name||f.away_team||f.teams?.away?.name||'Away',
    home_score:f.home_score??f.goals?.home??f.score?.home??0,
    away_score:f.away_score??f.goals?.away??f.score?.away??0,
    status:(f.status?.short||f.status||'LIVE').toUpperCase(),
    minute:f.status?.elapsed||f.minute||'LIVE',
    league_name:f.league?.name||'League',
    league_zone:f.country?.name||f.league?.country||'World',
    kickoff_utc:f.kickoff||f.fixture?.date||f.date
  }));

  return new Response(JSON.stringify({success:true,data:out,[STRIPPED]
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Cache-Control":"no-cache"}
  });

 }catch(err){
  return new Response(JSON.stringify({success:false,error:err.message,data:[]}),[STRIPPED]
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
 }
}
