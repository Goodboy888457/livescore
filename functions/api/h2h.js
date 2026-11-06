export async function onRequestGet(context){
 const {request, env} = context;
 const url = new URL(request.url);
 const id = url.searchParams.get('id'); // fixture id
 const home = url.searchParams.get('home');
 const away = url.searchParams.get('away');
 const KEY = env.HIGHLIGHTLY_API_KEY || env.HIGHLIGHTLY_KEY;

 if(!KEY){
   return new Response(JSON.stringify({success:false,error:"HIGHLIGHTLY_API_KEY missing"}),{
     status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
   });
 }

 try{
  // Highlightly H2H endpoint
  let apiUrl = `https://sports.highlightly.net/football/h2h?fixture_id=${id}`;
  
  // Alternative if above fails: try with teams
  // const apiUrl2 = `https://sports.highlightly.net/football/head2head?home=${home}&away=${away}`;

  let r = await fetch(apiUrl, {headers:{"x-api-key":KEY}});
  let txt = await r.text();
  let j = {};
  try{ j = JSON.parse(txt); }catch(e){ j={}; }

  let data = j.data || j.h2h || j.head2head || j || [];
  if(!Array.isArray(data)) data = data.matches || data.fixtures || [];

  // Normalize for your frontend
  const out = data.map(f=>({
    id:f.id||f.fixture_id,
    home_team:f.home_team?.name||f.home_team||f.teams?.home?.name||'Home',
    away_team:f.away_team?.name||f.away_team||f.teams?.away?.name||'Away',
    home_score:f.home_score??f.goals?.home??null,
    away_score:f.away_score??f.goals?.away??null,
    date:f.kickoff||f.date||f.datetime,
    league_name:f.league?.name||'League',
    status:f.status||'FT'
  }));

  return new Response(JSON.stringify({success:true, data:out}),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Cache-Control":"no-cache"}
  });

 }catch(err){
  return new Response(JSON.stringify({success:false,error:err.message,data:[]}),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
 }
}
