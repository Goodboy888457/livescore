export async function onRequest(context){
 try{
  const key = context.env.HIGHLIGHTLY_API_KEY;
  const url = new URL(context.request.url);
  const leagueQuery = (url.searchParams.get('leagueName')||'').toLowerCase().trim();
  
  let allMatches=[];
  // Fetch last 40 days - so we get ALL teams in any league
  for(let i=0;i<40;i++){
    let d=new Date(); d.setDate(d.getDate()-i);
    let date=d.toISOString().split('T')[0];
    try{
      let res=await fetch(`https://sports.highlightly.net/football/matches?date=${date}&limit=100`,{headers:{'x-rapidapi-key':key,'x-api-key':key}});
      let txt=await res.text();
      let json=JSON.parse(txt);
      let ms=json.data||json||[];
      if(Array.isArray(ms)) allMatches = allMatches.concat(ms);
      // If we have enough for Primeira Liga already, but continue to get all leagues
      if(allMatches.length>3000) break;
    }catch(e){}
  }
  
  // Filter if league specified
  let filtered = allMatches;
  if(leagueQuery && leagueQuery !== 'all'){
    filtered = allMatches.filter(m => {
      let ln = (m.league?.name||'').toLowerCase();
      return ln.includes(leagueQuery);
    });
    // If no results, try loose match (Premier -> Premier League)
    if(filtered.length===0){
      filtered = allMatches.filter(m => {
        let ln = (m.league?.name||'').toLowerCase();
        return leagueQuery.split(' ').some(word => word.length>3 && ln.includes(word));
      });
    }
  }
  
  let teams={};
  filtered.forEach(m=>{
    let h=m.homeTeam?.name||''; let a=m.awayTeam?.name||'';
    if(typeof h==='object') h=h.name||'Home'; if(typeof a==='object') a=a.name||'Away';
    if(!h||!a) return;
    if(!teams[h]) teams[h]={name:h, league:m.league?.name||'', pl:0, pts:0, w:0, d:0, l:0, gf:0, ga:0};
    if(!teams[a]) teams[a]={name:a, league:m.league?.name||'', pl:0, pts:0, w:0, d:0, l:0, gf:0, ga:0};
    let s=m.state?.score||{}; 
    let hs = s.current?.home ?? s.home ?? m.homeScore?.current ?? m.homeScore ?? 0;
    let as = s.current?.away ?? s.away ?? m.awayScore?.current ?? m.awayScore ?? 0;
    hs=parseInt(hs)||0; as=parseInt(as)||0;
    let desc=String(m.state?.description||'');
    if(desc.includes('Finished')){
      teams[h].pl++; teams[a].pl++;
      teams[h].gf+=hs; teams[h].ga+=as; teams[a].gf+=as; teams[a].ga+=hs;
      if(hs>as){teams[h].w++; teams[h].pts+=3; teams[a].l++;}
      else if(as>hs){teams[a].w++; teams[a].pts+=3; teams[h].l++;}
      else {teams[h].d++; teams[a].d++; teams[h].pts+=1; teams[a].pts+=1;}
    }
  });
  
  // Sort by points then GD
  let table = Object.values(teams)
    .filter(t=>t.pl>0)
    .sort((a,b)=> b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf)
    .map((t,i)=>({
      rank:i+1, 
      team:{name:t.name}, 
      points:t.pts, 
      all:{played:t.pl}, 
      goalsDiff:t.gf-t.ga,
      goals:{for:t.gf, against:t.ga},
      form:`${t.w}W ${t.d}D ${t.l}L`,
      league:t.league
    }));
  
  return new Response(JSON.stringify({response:table}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }catch(e){
  return new Response(JSON.stringify({response:[], error:e.message}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }
}
