export async function onRequest(context){
 try{
  const key = context.env.HIGHLIGHTLY_API_KEY;
  if(!key) return new Response(JSON.stringify({error:"No HIGHLIGHTLY_API_KEY"}),{headers:{'Content-Type':'application/json'}});
  
  const u = new URL(context.request.url);
  const type = u.searchParams.get('type') || 'today';
  
  const today = new Date();
  let dateStr = today.toISOString().split('T')[0];
  
  if(type==='yesterday'){
    const y = new Date(today);
    y.setDate(today.getDate()-1);
    dateStr = y.toISOString().split('T')[0];
  } else if(type==='tomorrow'){
    const t = new Date(today);
    t.setDate(today.getDate()+1);
    dateStr = t.toISOString().split('T')[0];
  } else if(type==='today'){
    dateStr = today.toISOString().split('T')[0];
  }
  
  // For yesterday/today/tomorrow we need date, for live/ft we get all and filter in frontend
  let apiUrl = `https://sports.highlightly.net/football/matches?date=${dateStr}&limit=100`;
  
  // If live or finished requested, fetch today's but frontend will filter - OR fetch without date for more live
  if(type==='live' || type==='finished'){
    apiUrl = `https://sports.highlightly.net/football/matches?date=${dateStr}&limit=100`;
  }
  
  const res = await fetch(apiUrl,{
    headers:{'x-rapidapi-key': key,'x-api-key': key}
  });
  
  if(!res.ok){
    const err = await res.text();
    return new Response(err,{status:res.status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
  
  const data = await res.text();
  return new Response(data,{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }catch(e){
  return new Response(JSON.stringify({error:e.message}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }
}
