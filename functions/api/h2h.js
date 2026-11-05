export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const team1 = url.searchParams.get('team1');
    const team2 = url.searchParams.get('team2');
    
    if(!team1 || !team2 || team1=='undefined' || team2=='undefined'){
      return new Response(JSON.stringify({data:[], message:"Missing IDs"}), {
        headers: {"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
      });
    }

    // Try multiple endpoints SportAPI might use
    const endpoints = [
      `https://sportapi.ai/api/h2h/${team1}/${team2}`,
      `https://sportapi.ai/api/football/h2h/${team1}/${team2}`,
      `https://sportapi.ai/api/matches/h2h?team1=${team1}&team2=${team2}`,
      `https://sportapi.ai/api/h2h?team1=${team1}&team2=${team2}`
    ];

    let lastText = "[]";
    for(let ep of endpoints){
      try{
        const res = await fetch(ep, {
          headers: { "X-Api-Key": env.SPORTAPI_KEY }
        });
        const text = await res.text();
        if(text && text.length > 10 && !text.includes('"data":[]') && !text.includes('Not Found')){
          lastText = text;
          break;
        }
        lastText = text;
      }catch(e){ continue; }
    }

    return new Response(lastText, {
      headers: {"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });

  } catch(e){
    return new Response(JSON.stringify({data:[], error:e.message}), {
      headers: {"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });
  }
}
