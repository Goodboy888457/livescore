export async function onRequestGet(context) {
  const { request, env } = context;
  const id = new URL(request.url).searchParams.get('id');
  
  const res = await fetch(`https://sportapi.ai/api/fixtures/${id}`, {
    headers: { "X-Api-Key": env.SPORTAPI_KEY }
  });
  
  let txt = await res.text();
  let j = JSON.parse(txt || '{}');
  let fixture = j.fixture || j.data || j || {};
  let events = fixture.events || [];

  // Also try events endpoint and merge
  try {
    const r2 = await fetch(`https://sportapi.ai/api/fixtures/${id}/events`, {
      headers: { "X-Api-Key": env.SPORTAPI_KEY }
    });
    let j2 = JSON.parse(await r2.text() || '{}');
    let ev2 = j2.data || [];
    if (ev2.length > events.length) events = ev2;
    if (ev2.length && events.length) {
      // merge unique
      let map = new Map();
      [...events, ...ev2].forEach(e => map.set(`${e.minute}-${e.player_name}-${e.event_type}`, e));
      events = [...map.values()];
    }
  } catch(e){}

  let mapped = events.map(e => {
    let type = (e.event_type || e.type || '').toLowerCase();
    let minute = (e.minute || '').toString();
    let inName = e.player_name || e.player || '';
    
    // FOR SUBSTITUTION - OUT NAME IS IN extra_info for SportAPI!
    let outName = '';
    let extra = (e.extra_info || e.extraInfo || '').toString();
    
    if (type.includes('substitut')) {
      // extra_info might be "Out: Eersteling J." or "Eersteling J." or "In - Out" format
      if (extra && extra !== 'Goal' && extra.length > 2) {
        outName = extra.replace('Out:', '').replace('out:', '').trim();
        // If extra is "Eersteling J. -> Alvarez F." split
        if (outName.includes('->')) outName = outName.split('->')[0].trim();
        if (outName.includes('-')) outName = outName.split('-')[0].trim();
      }
      // If extra_info empty, try to parse player_name like "Alvarez F. (Eersteling J.)"
      if (!outName && inName.includes('(')) {
        let m = inName.match(/\(([^)]+)\)/);
        if (m) {
          outName = m[1];
          inName = inName.replace(/\([^)]+\)/, '').trim();
        }
      }
    }

    let team_side = e.team_side || e.team || '';

    if (type.includes('substitut')) type = 'substitution';
    else if (type.includes('yellow')) type = 'yellow_card';
    else if (type.includes('red')) type = 'red_card';
    else if (type.includes('goal')) type = 'goal';

    return {
      minute, event_type: type, type,
      player_name: inName, player: inName, player_in: inName,
      player_out: outName, related_player: outName, out_player: outName,
      team_side, team: team_side,
      extra_info: extra,
      _raw: e
    };
  });

  return new Response(JSON.stringify({ data: mapped, total_from_api: events.length }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
