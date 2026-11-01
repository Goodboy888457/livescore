export async function onRequest(context){
 try{
  const key = context.env.HIGHLIGHTLY_API_KEY;
  const u = new URL(context.request.url);
  const home = (u.searchParams.get('home')||'').toLowerCase();
  const away = (u.searchParams.get('away')||'').toLowerCase();
  let all=[];
  for(let i=0;i<7;i++){let d=new Date(); d.setDate(d.getDate()-i); let date=d.toISOString().split('T')[0];
    try{let r=await fetch(`https://sports.highlightly.net/football/matches?date=${date}&limit=100`,{headers:{'x-rapidapi-key':key,'x-api-key':key}}); let j=await r.json(); let data=j.data||j||[];
      data.forEach(m=>{let h=(m.homeTeam?.name||'').toLowerCase(); let a=(m.awayTeam?.name||'').toLowerCase(); if((h.includes(home)&&a.includes(away))||(h.includes(away)&&a.includes(home))){all.push(m);}}); if(all.length>=5) break;}catch(e){}
  }
  return new Response(JSON.stringify({data:all.slice(0,5)}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }catch(e){return new Response(JSON.stringify({data:[]}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});}
}
