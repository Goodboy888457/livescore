export async function onRequestGet(context){
 const {request, env} = context;
 const date = new URL(request.url).searchParams.get('date') || new Date().toISOString().split('T')[0];
 const KEY = env.HIGHLIGHTLY_API_KEY || "";
 if(!KEY){
   return new Response(JSON.stringify({success:false,error:"Missing HIGHLIGHTLY_API_KEY in Cloudflare",data:[]}),[STRIPPED]
     headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
   });
 }
 try{
  const apiUrl=`https://sports.highlightly.net/football/matches?date=${date}`;
  const r=await fetch(apiUrl,{headers:{"x-rapidapi-key":KEY}});
  const txt=await r.text();
  let j={}; try{j=JSON.parse(txt);}catch(e){ return new Response(JSON.stringify({success:false,error:"Highlightly returned non-JSON: "+txt.slice(0,200),data:[]}),[STRIPPED]
    headers:{"Content-Type":"application/json"}
  }); }
  let raw=j.data||j.matches||j||[]; if(!Array.isArray(raw)) raw=[];
  const out=raw.map(m=>({
   id:String(m.id||''), home_team:m.homeTeam?.name||'Home', away_team:m.awayTeam?.name||'Away',
   home_score:m.homeTeam?.score??null, away_score:m.awayTeam?.score??null,
   status:(m.status||'NS').toString().toUpperCase(), minute:String(m.minute||''),
   league_name:m.league?.name||'League', league_zone:m.league?.country||'WORLD',
   datetime:m.date||date, kickoff_utc:m.date||date
  })).filter(x=>x.id);
  return new Response(JSON.stringify({success:true,data:out,count:out.length}),[STRIPPED]
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
 }catch(err){
  return new Response(JSON.stringify({success:false,error:err.message,data:[]}),[STRIPPED]
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });
 }
}
