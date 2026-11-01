export async function onRequest(context){
 try{
  const key = context.env.HIGHLIGHTLY_API_KEY;
  if(!key) return new Response(JSON.stringify({error:"No HIGHLIGHTLY_API_KEY"}),{headers:{'Content-Type':'application/json'}});
  
  const today = new Date().toISOString().split('T')[0];
  const apiUrl = `https://sports.highlightly.net/football/matches?date=${today}&limit=100`;
  
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
  return new Response(JSON.stringify({error:e.message}),{headers:{'Content-Type':'application/json'}});
 }
}
