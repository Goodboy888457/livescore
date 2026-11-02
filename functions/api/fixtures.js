export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 const url = new URL(context.request.url);
 let day = url.searchParams.get('day') || 'today';
 let date = new Date();
 if(day==='yest' || day==='ft') date.setDate(date.getDate()-1);
 if(day==='tomo') date.setDate(date.getDate()+1);
 let dateStr = date.toISOString().split('T')[0];
 
 try{
  let res = await fetch(`https://api.apisport.online/api/v1/matches?sport=football&date=${dateStr}&limit=500`, {
    headers:{'x-api-key':apiKey}
  });
  let json = await res.json();
  let data = json.data || [];
  
  let formatted = data.map(m=>({
    id: m.id,
    league: { name: m.league?.name || 'League', slug: m.league?.slug || 'premier-league', country: m.league?.country?.name || 'England' },
    teams: { home: {name: m.homeTeam?.name || 'Home'}, away: {name: m.awayTeam?.name || 'Away'} },
    goals: { home: m.homeScore ?? 0, away: m.awayScore ?? 0 },
    status: m.status || 'FT'
  }));
  
  if(!formatted.length) formatted = [{id:'demo1', league:{name:'Premier League',slug:'premier-league',country:'England'}, teams:{home:{name:'Liverpool'},away:{name:'Arsenal'}}, goals:{home:0,away:1}, status:'FT'}];
  
  return new Response(JSON.stringify({response:formatted}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }catch(e){
  return new Response(JSON.stringify({response:[]}), {headers:{'Content-Type':'application/json'}});
 }
}
