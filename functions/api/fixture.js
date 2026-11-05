export async function onRequest(context){
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  
  if(!id) return new Response(JSON.stringify({error:"need id"}),{
    headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
  });

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), context.request);
  
  // 1. Try Cloudflare cache - 0 API calls!
  let cached = await cache.match(cacheKey);
  if(cached) return cached;

  const apiKey = context.env.SPORTAPI_KEY || context.env.API_KEY;
  if(!apiKey){
    return new Response(JSON.stringify({error:"Missing SPORTAPI_KEY env", fixture:{id, home_team:"Config Error", away_team:"Set SPORTAPI_KEY in Cloudflare"}}),{
      headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });
  }

  try{
    const r = await fetch(`https://sportapi.ai/api/fixtures/${id}`,{
      headers:{"X-Api-Key": apiKey}
    });

    // 2. Handle 429 rate limit - your screenshot 818 case!
    if(r.status===429){
      let retry = r.headers.get('Retry-After') || '3600';
      return new Response(JSON.stringify({
        success:false,
        rateLimited:true,
        used: "818+",
        error: `Rate limit 2000/day reached. Resets at 00:00 UTC. Retry after ${retry}s`,
        fixture:{
          id,
          home_team: "Rate Limited - 818/2000",
          away_team: "Resets at 00:00 UTC",
          home_score: null,
          away_score: null,
          status: "Scheduled",
          league_name: "API Limit",
          datetime: new Date().toISOString()
        }
      }),{
        headers:{
          "Content-Type":"application/json",
          "Access-Control-Allow-Origin":"*",
          "Cache-Control":"public, max-age=60",
          "Retry-After": retry
        }
      });
    }

    const d = await r.json();
    
    // 3. Cache 60 seconds - saves your 2000/day limit!
    let response = new Response(JSON.stringify(d),{
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"public, max-age=30, s-maxage=60",
        "X-Cache":"MISS",
        "X-RateLimit-Remaining": r.headers.get('X-RateLimit-Remaining') || ''
      }
    });
    
    // Save to Cloudflare edge - next user gets cached!
    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;

  }catch(e){
    return new Response(JSON.stringify({
      success:false,
      error: e.message,
      fixture:{
        id,
        home_team: "Match "+id,
        away_team: "",
        home_score: null,
        away_score: null,
        status: "Scheduled",
        league_name: "Error - Retrying",
        datetime: "2026-11-06 21:00:00"
      }
    }),{
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"public, max-age=10"
      }
    });
  }
}

// Keep onRequestGet for compatibility - calls same function!
export async function onRequestGet(context){
  return onRequest(context);
}
