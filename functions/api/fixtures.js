export async function onRequestGet(context){
 const {request,env}=context;
 const url=new URL(request.url);
 const date=url.searchParams.get('date')||new Date().toISOString().split('T')[0];
 const KEY=env.HIGHLIGHTLY_API_KEY||env.HIGHLIGHTLY_KEY;
 
 if(!KEY){
   return new Response(JSON.stringify({success:false,error:"Add HIGHLIGHTLY_API_KEY in Cloudflare Variables"}),{
     status:500,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
   });
 }

 try{
  const apiUrl=`https://sports.highlightly.net/football/fixtures?date=${date}`;
  const apiRes=await fetch(apiUrl,{headers:{"x-api-key":KEY}});
  const json=await apiRes.json();
  
  let raw=json.data||json.fixtures||json.result||json||[];
  if(!Array.isArray(raw)) raw=[];

  const data=raw.map(f=>({
    id:f.id||f.fixture_id||`${Date.now()}_${Math.random()}`,
    home_team:f.home_team?.name||f.home_team||f.teams?.home?.name||f.home?.name||'Home',
    away_team:f.away_team?.name||f.away_team||f.teams?.away?.name||f.away?.name||'Away',
    home_score:f.home_score??f.goals?.home??f.score?.home??f.home_goals??null,
    away_score:f.away_score??f.goals?.away??f.score?.away??f.away_goals??null,
    status:(f.status?.short||f.status||f.state||'NS').toString().toUpperCase(),
    minute:f.minute||f.status?.elapsed||f.elapsed||'',
    league_name:f.league?.name||f.league_name||f.competition?.name||'League',
    league_zone:f.country?.name||f.league?.country||f.country||f.zone||'World',
    kickoff_utc:f.kickoff||f.fixture?.date||f.datetime||f.date,
    datetime:f.kickoff||f.datetime||f.date||date
  }));

  return new Response(JSON.stringify({success:true,data:data,total:data.length,date:date,source:"highlightly"}),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Cache-Control":"no-cache"}
  });

 }catch(err){
  return new Response(JSON.stringify({success:false,error:err.message}),{
    status:500,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
 }
}
