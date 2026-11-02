export async function onRequest(context){
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  if(!apiKey){
    return new Response(JSON.stringify({response:[], error:"SET APISPORT_API_KEY in Cloudflare Pages > Variables"}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }

  let res = await fetch(`https://api.apisport.online/api/v1/fixtures?date=${dateStr}&sport=football&limit=500`, {
    headers:{'x-api-key': apiKey}
  });
  let json = await res.json();
  let matches=[];
  (json.data||[]).forEach(league=>{
    (league.fixtures||[]).forEach(f=>{
      matches.push({
        league:{name:league.name, slug:league.slug, country:(league.country?.name||'World')},
        teams:{home:{name:f.homeTeam.name}, away:{name:f.awayTeam.name}},
        goals:{home:f.result?.homeScore, away:f.result?.awayScore},
        status:f.status,
        time:f.startTime? new Date(f.startTime).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):'',
        elapsed:f.elapsed||''
      });
    });
  });
  return new Response(JSON.stringify({response:matches}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}
