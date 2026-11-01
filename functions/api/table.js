export async function onRequest(context){
 try{
  const key = context.env.HIGHLIGHTLY_API_KEY;
  const url = new URL(context.request.url);
  const leagueName = url.searchParams.get('leagueName')||'Premier League';
  
  // TRY 1: Highlightly standings endpoint (complete table)
  const endpoints = [
    `https://sports.highlightly.net/football/standings?leagueName=${encodeURIComponent(leagueName)}`,
    `https://soccer.highlightly.net/standings?leagueName=${encodeURIComponent(leagueName)}`,
    `https://sports.highlightly.net/football/standings?league=${encodeURIComponent(leagueName)}`,
  ];
  
  for(let apiUrl of endpoints){
    try{
      let res = await fetch(apiUrl,{headers:{'x-rapidapi-key':key,'x-api-key':key,'x-apisports-key':key}});
      let txt = await res.text();
      let json = JSON.parse(txt);
      let data = json.data || json.response || json || [];
      
      // Check if we got real standings
      if(Array.isArray(data) && data.length>5){
        // Normalize to format index.html expects
        let table = data.map((t,i)=>{
          return {
            rank: t.rank || t.position || i+1,
            team: {name: t.team?.name || t.name || t.teamName || 'Team'},
            points: t.points || t.pts || 0,
            all: {played: t.played || t.matches || t.all?.played || t.games || 0},
            goalsDiff: t.goalsDiff || t.goalDiff || 0,
            form: t.form || ''
          };
        });
        if(table.length>5){
          return new Response(JSON.stringify({response: table}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
        }
      }
      // If data has standings nested
      if(json.standings && json.standings.length>5){
        return new Response(JSON.stringify({response: json.standings}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
      }
    }catch(e){continue;}
  }
  
  // FALLBACK: Build from recent matches if standings endpoint fails
  let allMatches=[];
  for(let i=0;i<30;i++){
    let d=new Date(); d.setDate(d.getDate()-i); let date=d.toISOString().split('T')[0];
    try{
      let r=await fetch(`https://sports.highlightly.net/football/matches?date=${date}&leagueName=${encodeURIComponent(leagueName)}&limit=100`,{headers:{'x-rapidapi-key':key,'x-api-key':key}});
      let j=await r.json(); let m=j.data||j||[]; allMatches=[...allMatches,...m];
      if(allMatches.length>100) break;
    }catch(e){}
  }
  
  let teams={};
  allMatches.forEach(m=>{
    let h=m.homeTeam?.name||''; let a=m.awayTeam?.name||'';
    if(!h||!a) return;
    if(!teams[h]) teams[h]={name:h,pl:0,w:0,d:0,l:0,pts:0,gf:0,ga:0};
    if(!teams[a]) teams[a]={name:a,pl:0,w:0,d:0,l:0,pts:0,gf:0,ga:0};
    let sc=m.state?.score||{}; let hs=parseInt(sc.home??0); let as=parseInt(sc.away??0);
    if(String(m.state?.description).includes('Finished')){
      teams[h].pl++; teams[a].pl++;
      teams[h].gf+=hs; teams[h].ga+=as;
      teams[a].gf+=as; teams[a].ga+=hs;
      if(hs>as){teams[h].w++; teams[h].pts+=3; teams[a].l++;}
      else if(as>hs){teams[a].w++; teams[a].pts+=3; teams[h].l++;}
      else {teams[h].d++; teams[a].d++; teams[h].pts+=1; teams[a].pts+=1;}
    }
  });
  
  let table = Object.values(teams).sort((a,b)=> b.pts - a.pts || (b.gf-b.ga)-(a.gf-a.ga)).map((t,i)=>({
    rank:i+1, team:{name:t.name}, points:t.pts, all:{played:t.pl}, goalsDiff:t.gf-t.ga, form:`${t.w}W ${t.d}D ${t.l}L`
  }));
  
  return new Response(JSON.stringify({response: table}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }catch(e){
  return new Response(JSON.stringify({response:[], error:e.message}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }
}
