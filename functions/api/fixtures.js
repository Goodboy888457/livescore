export async function onRequestGet(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const KEY = env.FOOTBALL_API_KEY || env.API_FOOTBALL_KEY || env.API_FOOTBALL || env.FOOTBALL_KEY;

  if (!KEY) {
    return new Response(JSON.stringify({ success:false, error:"No API key", data:[] }), {
      headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }
    });
  }

  const CACHE_KEY = `https://cache.livescore/${date}`;
  const H = { "x-apisports-key": KEY.trim() };

  async function fetchRaw(u){
    try{
      const r = await fetch(u, { headers:H });
      if(r.status===429) throw new Error("Rate limit hit - 100 req/day");
      const j = await r.json();
      if(j.errors && Object.keys(j.errors).length>0) {
        if(j.errors.requests) throw new Error(j.errors.requests);
        return [];
      }
      return j.response || [];
    }catch(e){ 
      console.log("Fetch error:", u, e.message);
      return null; // null means error, [] means empty
    }
  }

  function toOut(raw){
    return raw.map(m=>({
      id:String(m.fixture?.id),
      home_team:m.teams?.home?.name||"Home",
      away_team:m.teams?.away?.name||"Away",
      home_score:m.goals?.home??null,
      away_score:m.goals?.away??null,
      status:m.fixture?.status?.short||"NS",
      minute:String(m.fixture?.status?.elapsed||""),
      league_name:m.league?.name||"League",
      league_zone:m.league?.country||"WORLD",
      datetime:m.fixture?.date||new Date().toISOString(),
      kickoff_utc:m.fixture?.date||new Date().toISOString()
    }));
  }

  // TRY CACHE FIRST - 5 minutes cache
  try{
    const cache = caches.default;
    let cached = await cache.match(CACHE_KEY);
    if(cached){
      let cj = await cached.clone().json();
      // If cached data still fresh (<5 min), return it
      if(cj.cachedAt && (Date.now() - cj.cachedAt < 5*60*1000)){
        return new Response(JSON.stringify({...cj, fromCache:true}), {
          headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "X-Cache":"HIT" }
        });
      }
    }
  }catch{}

  try{
    // Fetch with priority - live + next always works
    let live = await fetchRaw(`https://v3.football.api-sports.io/fixtures?live=all`);
    let next = await fetchRaw(`https://v3.football.api-sports.io/fixtures?next=50`);
    let byDate = await fetchRaw(`https://v3.football.api-sports.io/fixtures?date=${date}`);

    // If all failed (rate limit), try return cached version
    if(live===null && next===null && byDate===null){
      try{
        const cache = caches.default;
        let cached = await cache.match(CACHE_KEY);
        if(cached){
          let cj = await cached.json();
          return new Response(JSON.stringify({...cj, fromCache:true, note:"Serving cached - API rate limit"}), {
            headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "X-Cache":"STALE" }
          });
        }
      }catch{}
      // No cache - return mock so site NEVER empty
      let mock = [
        {fixture:{id:1001, date:new Date().toISOString(), status:{short:"1H", elapsed:"34"}}, teams:{home:{name:"Arsenal"}, away:{name:"Chelsea"}}, goals:{home:1, away:0}, league:{name:"Premier League", country:"England"}},
        {fixture:{id:1002, date:new Date().toISOString(), status:{short:"NS", elapsed:""}}, teams:{home:{name:"Real Madrid"}, away:{name:"Barcelona"}}, goals:{home:null, away:null}, league:{name:"La Liga", country:"Spain"}},
        {fixture:{id:1003, date:new Date().toISOString(), status:{short:"FT", elapsed:"90"}}, teams:{home:{name:"Bayern Munich"}, away:{name:"Dortmund"}}, goals:{home:2, away:1}, league:{name:"Bundesliga", country:"Germany"}},
        {fixture:{id:1004, date:new Date().toISOString(), status:{short:"LIVE", elapsed:"67"}}, teams:{home:{name:"PSG"}, away:{name:"Lyon"}}, goals:{home:2, away:2}, league:{name:"Ligue 1", country:"France"}},
        {fixture:{id:1005, date:new Date().toISOString(), status:{short:"NS", elapsed:""}}, teams:{home:{name:"Inter"}, away:{name:"AC Milan"}}, goals:{home:null, away:null}, league:{name:"Serie A", country:"Italy"}},
        {fixture:{id:1006, date:new Date().toISOString(), status:{short:"FT", elapsed:"90"}}, teams:{home:{name:"Man City"}, away:{name:"Man United"}}, goals:{home:3, away:1}, league:{name:"Premier League", country:"England"}},
      ];
      let out = toOut(mock);
      return new Response(JSON.stringify({ success:true, data:out, count:out.length, date, source:"mock-fallback-rate-limit", note:"API rate limit - showing sample" }), {
        headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }
      });
    }

    // Merge - filter nulls
    let allRaw = [];
    if(live) allRaw = [...allRaw, ...live];
    if(byDate) allRaw = [...allRaw, ...byDate];
    if(next) allRaw = [...allRaw, ...next];
    
    // Deduplicate
    let map = new Map();
    allRaw.forEach(f=>{ if(f.fixture?.id) map.set(f.fixture.id, f); });
    let combined = Array.from(map.values());

    if(combined.length===0){
      let last = await fetchRaw(`https://v3.football.api-sports.io/fixtures?last=30`);
      if(last) combined = last;
    }

    let out = toOut(combined);

    // Save to cache for 5 mins
    let responseData = { success:true, data:out, count:out.length, date, cachedAt: Date.now(), source:"api-live" };
    try{
      const cache = caches.default;
      await cache.put(CACHE_KEY, new Response(JSON.stringify(responseData), {
        headers:{ "Content-Type":"application/json", "Cache-Control":"public, max-age=300" }
      }));
    }catch{}

    return new Response(JSON.stringify(responseData), {
      headers:{
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"public, max-age=60",
        "X-Cache":"MISS"
      }
    });

  }catch(e){
    return new Response(JSON.stringify({ success:false, error:e.message, data:[] }), {
      headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" }
    });
  }
}
