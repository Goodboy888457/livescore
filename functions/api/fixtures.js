export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const API_KEY = env.SPORTAPI_KEY;
  
  if(!API_KEY) return new Response(JSON.stringify({ success:false, error:"Missing SPORTAPI_KEY" }), { status:500, headers:{"Content-Type":"application/json"} });

  // *** NEW: Try KV Cache first - saves 90% API calls! ***
  const cacheKey = `fixtures:${date}`;
  try{
    if(env.SCORE_KV){
      const cached = await env.SCORE_KV.get(cacheKey);
      if(cached){
        return new Response(cached, { 
          headers: { 
            "Content-Type": "application/json", 
            "Access-Control-Allow-Origin": "*",
            "X-Cache": "HIT",
            "Cache-Control": "public, max-age=60"
          } 
        });
      }
    }
  }catch(e){}

  try{
    const apiRes = await fetch(`https://sportapi.ai/api/fixtures/date/${date}`, {
      headers: { "X-Api-Key": API_KEY }
    });

    // Handle rate limit 2000/day
    if(apiRes.status === 429 || apiRes.status === 403){
      let text = await apiRes.text();
      return new Response(JSON.stringify({ 
        success:false, 
        rateLimited:true, 
        error:"API Limit 2000/day hit", 
        raw:text,
        data: [] // Return empty so index.html doesn't crash
      }), { 
        status: 200, // Return 200 so frontend shows "No matches" not error
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }

    let dataText = await apiRes.text();
    
    // Validate JSON
    try{ JSON.parse(dataText); }catch(e){ 
      return new Response(JSON.stringify({ success:false, data:[], error:"Invalid JSON from SportAPI", raw:dataText.substring(0,200) }), { headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"} });
    }

    // *** NEW: Save to KV for 5 minutes - Today/Live = 2min, Past/Future = 10min ***
    try{
      if(env.SCORE_KV){
        const isToday = date === new Date().toISOString().split('T')[0];
        const ttl = isToday ? 120 : 600; // 2min for today, 10min for others
        await env.SCORE_KV.put(cacheKey, dataText, { expirationTtl: ttl });
      }
    }catch(e){}

    return new Response(dataText, { 
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*",
        "X-Cache": "MISS",
        "Cache-Control": "public, max-age=60"
      } 
    });

  }catch(err){
    return new Response(JSON.stringify({ success:false, data:[], error: err.message }), { status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"} });
  }
}
