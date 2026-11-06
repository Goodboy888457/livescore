export async function onRequestGet(context){
 const {request, env} = context;
 const url = new URL(request.url);
 const teamId = url.searchParams.get('team_id') || url.searchParams.get('id') || '';
 const leagueId = url.searchParams.get('league_id') || '';
 const KEY = env.HIGHLIGHTLY_API_KEY || env.HIGHLIGHTLY_KEY;

 if(!KEY){
   return new Response(JSON.stringify({success:false,error:"HIGHLIGHTLY_API_KEY missing"}),{
     status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
   });
 }

 try{
  let apiUrl = '';
  if(teamId){
    apiUrl = `https://sports.highlightly.net/football/teams/${teamId}`;
  } else if(leagueId){
    apiUrl = `https://sports.highlightly.net/football/teams?league_id=${leagueId}`;
  } else {
    apiUrl = `https://sports.highlightly.net/football/teams`;
  }

  const r = await fetch(apiUrl, {headers:{"x-api-key":KEY}});
  const j = await r.json();

  let data = j.data || j.teams || j || [];
  if(!Array.isArray(data)) data = [data];

  const out = data.map(t=>({
    id:t.id||t.team_id,
    name:t.name||t.team_name,
    logo:t.logo||t.badge||'',
    country:t.country?.name||t.country||'',
    founded:t.founded||'',
    venue:t.venue?.name||''
  }));

  return new Response(JSON.stringify({success:true,data:out}),[STRIPPED]
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Cache-Control":"no-cache"}
  });

 }catch(err){
  return new Response(JSON.stringify({success:false,error:err.message,data:[]}),[STRIPPED]
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
 }
}
