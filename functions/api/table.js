export async function onRequest(context){
 const apiKey = context.env.APISPORT_API_KEY;
 const url = new URL(context.request.url);
 let slug = (url.searchParams.get('leagueName') || url.searchParams.get('league') || url.searchParams.get('id') || 'premier-league').toLowerCase().trim();
 
 if(!apiKey) return new Response(JSON.stringify({response: []}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});

 try{
   // Try many endpoint formats for many leagues
   let tries = [
     `https://api.apisport.online/api/v1/standings?league=${slug}`,
     `https://api.apisport.online/api/v1/standings?league=${encodeURIComponent(slug)}`,
     `https://api.apisport.online/api/v1/leagues/${slug}/standings`,
     `https://api.apisport.online/api/v1/standings?competition=${slug}`
   ];

   let standingsArray = null;

   for(let ep of tries){
     try{
       let res = await fetch(ep, { headers: { 'x-api-key': apiKey } });
       let json = await res.json();
       let data = json.data || json.response || json;
       if(!data) continue;

       // 🔥 YOUR API FORMAT: data.standings.Overall
       if(data.standings?.Overall && Array.isArray(data.standings.Overall)){
         standingsArray = data.standings.Overall;
       } else if(data.standings && typeof data.standings === 'object'){
         // Find first array inside standings (Overall, Home, etc)
         for(let k of Object.keys(data.standings)){
           if(Array.isArray(data.standings[k]) && data.standings[k].length>0){
             standingsArray = data.standings[k];
             break;
           }
         }
       } else if(Array.isArray(data.standings)){
         standingsArray = data.standings;
       } else if(data.Overall){
         standingsArray = data.Overall;
       } else if(Array.isArray(data) && data[0]?.standings?.Overall){
         standingsArray = data[0].standings.Overall;
       }

       if(standingsArray && standingsArray.length>0) break;
     }catch(e){}
   }

   if(!standingsArray || standingsArray.length===0){
     return new Response(JSON.stringify({response: [], error:`No table for ${slug}`}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
   }

   let table = standingsArray.map(t=>({
     rank: t.rank, position: t.rank,
     team: { name: t.team?.name || t.name },
     teamName: t.team?.name,
     played: t.played, won: t.won, drawn: t.drawn, lost: t.lost,
     goalsFor: t.goalsFor, goalsAgainst: t.goalsAgainst,
     points: t.points, goalDifference: t.goalDifference, form: t.form||'',
     MP: t.played, W: t.won, D: t.drawn, L: t.lost, G: `${t.goalsFor}:${t.goalsAgainst}`, PTS: t.points
   }));

   return new Response(JSON.stringify({response: table, data: table, league: slug}), {
     headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=120'}
   });
 }catch(e){
   return new Response(JSON.stringify({response: [], error: e.message}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
 }
}
