export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const API_KEY = env.SPORTAPI_KEY;

  if (!id) {
    return new Response(JSON.stringify({ data: [] }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    let matches = [];

    // TRY 1: /api/teams/{id}
    try {
      let res = await fetch(`https://sportapi.ai/api/teams/${id}`, {
        headers: { "X-Api-Key": API_KEY }
      });
      let txt = await res.text();
      if (txt && !txt.trim().startsWith('<')) {
        let j = JSON.parse(txt);
        if (j.matches && j.matches.length) matches = j.matches;
        else if (j.fixtures && j.fixtures.length) matches = j.fixtures;
        else if (j.data && Array.isArray(j.data)) matches = j.data;
        else if (j.data && j.data.matches) matches = j.data.matches;
      }
    } catch(e){}

    // TRY 2: /api/fixtures?team_id={id}
    if (matches.length === 0) {
      try {
        let res = await fetch(`https://sportapi.ai/api/fixtures?team_id=${id}&limit=10`, {
          headers: { "X-Api-Key": API_KEY }
        });
        let txt = await res.text();
        if (txt && !txt.trim().startsWith('<')) {
          let j = JSON.parse(txt);
          if (j.data && j.data.length) matches = j.data;
          else if (j.fixtures) matches = j.fixtures;
        }
      } catch(e){}
    }

    // TRY 3: /api/teams/{id}/fixtures
    if (matches.length === 0) {
      try {
        let res = await fetch(`https://sportapi.ai/api/teams/${id}/fixtures`, {
          headers: { "X-Api-Key": API_KEY }
        });
        let txt = await res.text();
        if (txt && !txt.trim().startsWith('<')) {
          let j = JSON.parse(txt);
          if (j.data) matches = j.data;
        }
      } catch(e){}
    }

    let filtered = matches.filter(m => m.home_score != null && m.away_score != null).slice(0,5);

    return new Response(JSON.stringify({ data: filtered }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: [], error: e.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
