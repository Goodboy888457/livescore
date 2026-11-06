export async function onRequestGet(c){
 const id=new URL(c.request.url).searchParams.get('id');
 const KEY=c.env.HIGHLIGHTLY_API_KEY||c.env.HIGHLIGHTLY_KEY;
 const r=await fetch(`https://sports.highlightly.net/football/events?fixture_id=${id}`,{headers:{"x-api-key":KEY}});
 const j=await r.json();
 let data=j.data||j.events||j||[];
 if(!Array.isArray(data)) data=[];
 const norm=data.map(e=>({
  minute:e.minute||e.time?.elapsed||e.time,
  event_type:e.type||e.detail||e.event_type||'',
  team_side:e.team?.name||e.team||'',
  player:e.player?.name||e.player_name||e.player||'',
  player_in:e.player?.name||e.player_name||'',
  player_out:e.assist?.name||e.related_player||'',
  related:e.related_player||e.assist?.name||''
 }));
 return new Response(JSON.stringify({data:norm}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
