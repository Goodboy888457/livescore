export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const API_KEY = env.SPORTAPI_KEY;
  
  if(!API_KEY) return new Response(JSON.stringify({ success:false, error:"Missing SPORTAPI_KEY" }), { status:500, headers:{"Content-Type":"application/json"} });

  const cacheKey = `fixtures:${date}`;
  const isToday = date === new Date().toISOString().split('T')[0];

  // Use KV cache - but smart for LIVE
  try{
    if(env.SCORE_KV && !url.searchParams.has('nocache')){
      const cached = await env.SCORE_KV.get(cacheKey);
      if(cached && !isToday){
        // Past/future - safe to use cache
        return new Response(cached, { 
          headers: { 
            "Content-Type": "application/json", 
            "Access-Control-Allow-Origin": "*",
            "X-Cache": "HIT",
            "Cache-Control": "public, max-age=600"
          } 
        });
      }
      // For today, we skip cache if it contains LIVE to get fresh scores
      // So we don't return here for today - we go fetch fresh
    }
  }catch(e){}

  try{
    const apiRes = await fetch(`https://sportapi.ai/api/fixtures/date/${date}`, {
      headers: { "X-Api-Key": API_KEY }
    });

    if(apiRes.status === 429 || apiRes.status === 403){
      let text = await apiRes.text();
      return new Response(JSON.stringify({ 
        success:false, 
        rateLimited:true, 
        error:"API Limit 2000/day hit", 
        raw:text,
        data: [] 
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }

    let dataText = await apiRes.text();
    
    try{ JSON.parse(dataText); }catch(e){ 
      return new Response(JSON.stringify({ success:false, data:[], error:"Invalid JSON from SportAPI", raw:dataText.substring(0,200) }), { headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"} });
    }

    // Smart TTL: LIVE = 30s, Today = 60s, Other = 600s
    try{
      if(env.SCORE_KV){
        let ttl = 600;
        if(isToday){
          let parsed = JSON.parse(dataText);
          let hasLive = (parsed.data||[]).some(m=> ['LIVE','HT','1H','2H','IN_PLAY'].includes(String(m.status||'').toUpperCase()));
          ttl = hasLive ? 30 : 60;
        }
        await env.SCORE_KV.put(cacheKey, dataText, { expirationTtl: ttl });
      }
    }catch(e){}

    return new Response(dataText, { 
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "MISS",
        "Cache-Control": isToday ? "public, max-age=30" : "public, max-age=300"
      } 
    });

  }catch(err){
    return new Response(JSON.stringify({ success:false, data:[], error: err.message }), { status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"} });
  }
}
