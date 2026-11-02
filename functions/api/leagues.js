export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 try{
   let leagues = [];
   if(apiKey){
     try{
       let res = await fetch('https://api.apisport.online/api/v1/leagues', {headers:{'x-api-key':apiKey}});
       let json = await res.json();
       let data = json.data || json.response || [];
       if(data.length){
         leagues = data.map(l=>({
           name: l.name,
           slug: l.slug || l.name.toLowerCase().replace(/\s+/g,'-'),
           country: l.country?.name || l.country || 'World',
           id: l.id
         }));
       }
     }catch(e){}
   }
   // Fallback if API fails - MANY LEAGUES
   if(!leagues.length){
     leagues = [
       {name:'Premier League', slug:'premier-league', country:'England'},
       {name:'LaLiga', slug:'laliga', country:'Spain'},
       {name:'Bundesliga', slug:'bundesliga', country:'Germany'},
       {name:'Serie A', slug:'serie-a', country:'Italy'},
       {name:'Ligue 1', slug:'ligue-1', country:'France'},
       {name:'Eredivisie', slug:'eredivisie', country:'Netherlands'},
       {name:'Primeira Liga', slug:'primeira-liga', country:'Portugal'},
       {name:'Championship', slug:'championship', country:'England'},
       {name:'Super Lig', slug:'super-lig', country:'Turkey'},
       {name:'NPFL', slug:'npfl', country:'Nigeria'},
       {name:'Belgian Pro League', slug:'belgian-pro-league', country:'Belgium'},
       {name:'Scottish Premiership', slug:'scottish-premiership', country:'Scotland'},
       {name:'MLS', slug:'mls', country:'USA'},
       {name:'Saudi Pro League', slug:'saudi-pro-league', country:'Saudi Arabia'},
       {name:'Champions League', slug:'ucl', country:'Europe'},
       {name:'Europa League', slug:'europa', country:'Europe'},
     ];
   }
   return new Response(JSON.stringify({response: leagues}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }catch(e){
   return new Response(JSON.stringify({response: []}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }
}
