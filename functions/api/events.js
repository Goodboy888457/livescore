export async function onRequestGet(context) {
  const { request, env } = context;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ data: [] }), { 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }

  const res = await fetch(`https://sportapi.ai/api/fixtures/${id}/events`, {
    headers: { "X-Api-Key": env.SPORTAPI_KEY }
  });

  let rawText = await res.text();
  let rawJson;
  try { rawJson = JSON.parse(rawText); } catch (e) { rawJson = []; }
  
  let events = rawJson.data || rawJson.events || rawJson || [];
  if (!Array.isArray(events)) events = [events];

  // UNIVERSAL MAPPER FOR ALL LEAGUES - Makes IN/OUT complete like Flashscore
  let mapped = events.map(e => {
    let type = (e.event_type || e.type || e.eventType || e.event || '').toString().toLowerCase();
    let minute = (e.minute || e.time || e.min || e.minute_str || '').toString();

    // IN player - try all possible fields
    let inName = e.player_name || e.player || e.player_in || e.in_player || e.sub_in || e.playerIn || e.name || e.playerName || '';
    if (typeof inName === 'object' && inName) inName = inName.name || inName.player_name || '';

    // OUT player - THIS IS THE FIX FOR ALL LEAGUES - check 15 fields
    let outName = e.player_out || e.related_player || e.out_player || e.second_player || e.player2 || e.sub_out || e.playerOut || e.assist_player || e.assist || e.player_out_name || e.outgoing || e.replaced || e.related || e.player_related || e.extra_player || '';
    if (typeof outName === 'object' && outName) outName = outName.name || outName.player_name || '';

    // If SportAPI sends description like "Moreira D. (Musah Y.)" parse it
    if (!outName && e.description && e.description.includes('(')) {
      let m = e.description.match(/\(([^)]+)\)/);
      if (m) outName = m[1];
    }
    if (!outName && e.comment && e.comment.includes('(')) {
      let m = e.comment.match(/\(([^)]+)\)/);
      if (m) outName = m[1];
    }

    let team_side = e.team_side || e.team || e.side || e.teamSide || e.team_name || '';
    if (typeof team_side === 'object' && team_side) team_side = team_side.name || team_side.title || '';

    // Clean type for frontend
    if (type.includes('substitut') || type.includes('change') || type.includes('subst')) type = 'substitution';
    else if (type.includes('yellow')) type = 'yellow_card';
    else if (type.includes('red')) type = 'red_card';
    else if (type.includes('goal')) type = 'goal';

    return {
      minute: minute,
      event_type: type,
      type: type,
      player_name: inName,
      player: inName,
      player_in: inName,
      player_out: outName,
      related_player: outName,
      out_player: outName,
      team_side: team_side,
      team: team_side,
      // Keep original for debug
      _original_type: e.event_type || e.type,
      _raw: e
    };
  });

  return new Response(JSON.stringify({ data: mapped }), { 
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
  });
}
