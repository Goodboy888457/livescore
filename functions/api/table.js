export async function onRequest(context){
 try{
  const key = context.env.HIGHLIGHTLY_API_KEY;
  const url = new URL(context.request.url);
  const leagueName = (url.searchParams.get('leagueName')||'').toLowerCase();
  
  let allMatches = [];
  // Get last 14 days matches to build table
  for(let i=0;i<14;i++){
    let d=new Date(); d.setDate(d.getDate()-i);
    let date=d.toISOString().split('T')[0];
    try{
      let res=await fetch(`https://sports.highlightly.net/football/matches?date=${date}&limit=100`,{headers:{'x-rapidapi-key':key,'x-api-key':key}});
      let json=JSON.parse(await res.text());
      let ms=json.data||json||[];
      allMatches = allMatches.concat(ms);
    }catch(e){}
  }
  
  if(leagueName) allMatches = allMatches.filter(m => (m.league?.name||'').toLowerCase().includes(leagueName));
  
  let teams={};
  allMatches.forEach(m=>{
    let h=m.homeTeam?.name||'Home'; let a=m.awayTeam?.name||'Away';
    if(typeof h==='object') h=h.name; if(typeof a==='object') a=a.name;
    if(!teams[h]) teams[h]={name:h,pl:0,pts:0,gs:0,gc:0}; 
    if(!teams[a]) teams[a]={name:a,pl:0,pts:0,gs:0,gc:0};
    
    // Real score
    let s=m.state?.score||{}; 
    let hs=s.current?.home ?? s.home ?? m.homeScore?.current ?? 0;
    let as=s.current?.away ?? s.away ?? m.awayScore?.current ?? 0;
    hs=Number(hs)||0; as=Number(as)||0;
    
    let desc=String(m.state?.description||'');
    if(desc.includes('Finished')){
      teams[h].pl++; teams[a].pl++;
      teams[h].gs+=hs; teams[h].gc+=as;
      teams[a].gs+=as; teams[a].gc+=hs;
      if(hs>as) teams[h].pts+=3; 
      else if(as>hs) teams[a].pts+=3; 
      else {teams[h].pts+=1; teams[a].pts+=1;}
    }
  });
  
  let table = Object.values(teams).sort((a,b)=> b.pts - a.pts || (b.gs-b.gc)-(a.gs-a.gc)).map((t,i)=>({rank:i+1, team:{name:t.name}, points:t.pts, all:{played:t.pl}}));
  
  return new Response(JSON.stringify({response:table}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }catch(e){
  return new Response(JSON.stringify({response:[], error:e.message}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }
}
