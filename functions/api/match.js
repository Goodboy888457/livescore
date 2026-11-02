export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 const url = new URL(context.request.url);
 const id = url.searchParams.get('id');
 
 if(!apiKey){
   return new Response(JSON.stringify({error: 'NO API KEY - Add APISPORT_API_KEY in Cloudflare Variables'}), {
     headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
   });
 }
 
 if(!id){
   return new Response(JSON.stringify({error: 'no id - use ?id=12345'}), {
     headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}
   });
 }

 let result = {
   id,
   summary: [],
   stats: null,
   lineups: null,
   events: [],
   table: null
 };

 try {
   // 1. GET MATCH INFO
   let matchRes = await fetch(`https://api.apisport.online/api/v1/matches?sport=football&matchId=${id}`, {
     headers: { 'x-api-key': apiKey }
   });
   let matchJson = await matchRes.json();
   if(matchJson.data && matchJson.data.length) result.match = matchJson.data[0];
   else if(matchJson.data && matchJson.data.id) result.match = matchJson.data;

   // 2. GET STATS - Try different endpoint patterns
   try{
     let statsRes = await fetch(`https://api.apisport.online/api/v1/matches/${id}/statistics`, {
       headers: { 'x-api-key': apiKey }
     });
     let statsJson = await statsRes.json();
     if(statsJson.data) result.stats = statsJson.data;
   }catch(e){}

   // 3. GET LINEUPS
   try{
     let lineupRes = await fetch(`https://api.apisport.online/api/v1/matches/${id}/lineups`, {
       headers: { 'x-api-key': apiKey }
     });
     let lineupJson = await lineupRes.json();
     if(lineupJson.data) result.lineups = lineupJson.data;
   }catch(e){}

   // 4. GET EVENTS (goals, cards)
   try{
     let eventsRes = await fetch(`https://api.apisport.online/api/v1/matches/${id}/events`, {
       headers: { 'x-api-key': apiKey }
     });
     let eventsJson = await eventsRes.json();
     if(eventsJson.data) {
       result.events = eventsJson.data;
       result.summary = eventsJson.data;
     }
   }catch(e){}

   // If all fails, return demo Kingdom data so modal no empty
   if(!result.events.length && !result.stats){
     result.summary = [
       { minute: "16'", type: 'Goal', player: 'Havertz (Rice)', team: 'home' },
       { minute: "45+4'", type: 'Yellow', player: 'Barcola', team: 'away' },
       { minute: "58'", type: 'Foul', player: 'Mac Allister', team: 'home' },
       { minute: "72'", type: 'Goal', player: 'Salah', team: 'home' }
     ];
     result.stats = {
       possession: { home: 56, away: 44 },
       shots: { home: 17, away: 10 },
       corners: { home: 7, away: 4 },
       xG: { home: '1.04', away: '0.96' }
     };
     result._demo = true;
   }

 } catch(err){
   result.error = err.message;
 }

 return new Response(JSON.stringify(result), {
   headers: {
     'Content-Type':'application/json',
     'Access-Control-Allow-Origin':'*',
     'Cache-Control': 'public, max-age=60'
   }
 });
}
