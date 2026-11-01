export async function onRequest(context){
 try{
  const key = context.env.HIGHLIGHTLY_API_KEY;
  const url = new URL(context.request.url);
  const leagueName = (url.searchParams.get('leagueName')||'').toLowerCase();
  
  // Try get today's matches for that league and build table from form
  const today = new Date().toISOString().split('T')[0];
  const apiUrl = `https://sports.highlightly.net/football/matches?date=${today}&limit=100`;
  const res = await fetch(apiUrl,{headers:{'x-rapidapi-key':key,'x-api-key':key}});
  const text = await res.text();
  const json = JSON.parse(text);
  let matches = json.data || json || [];
  
  // Filter by league if provided
  if(leagueName){
    matches = matches.filter(m => (m.league?.name||'').toLowerCase().includes(leagueName));
  }
  
  // Build simple table from results
  let teams = {};
  matches.forEach(m=>{
    let h = m.homeTeam?.name||'Home'; let a = m.awayTeam?.name||'Away';
    if(!teams[h]) teams[h]={name:h,pl:0,pts:0,w:0};
    if(!teams[a]) teams[a]={name:a,pl:0,pts:0,w:0};
    let sc = m.state?.score||{}; let hs = sc.home??0; let as = sc.away??0;
    if(m.state?.description==='Finished'){
      teams[h].pl++; teams[a].pl++;
      if(hs>as) teams[h].pts+=3; else if(as>hs) teams[a].pts+=3; else {teams[h].pts+=1; teams[a].pts+=1;}
    }
  });
  
  let table = Object.values(teams).sort((a,b)=>b.pts-a.pts);
  // Return in format index.html expects
  return new Response(JSON.stringify({response: table.map((t,i)=>({rank:i+1, team:{name:t.name}, points:t.pts, all:{played:t.pl}}))}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }catch(e){
  return new Response(JSON.stringify({response:[]}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }
}
