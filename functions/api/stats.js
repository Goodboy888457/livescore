export async function onRequestGet(context){
 const {request, env} = context;
 const id = new URL(request.url).searchParams.get('id'); // fixture id
 const KEY = env.HIGHLIGHTLY_API_KEY || env.HIGHLIGHTLY_KEY;

 if(!KEY){
   return new Response(JSON.stringify({success:false,error:"HIGHLIGHTLY_API_KEY missing"}),{
     status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
   });
 }

 try{
  const apiUrl = `https://sports.highlightly.net/football/statistics?fixture_id=${id}`;
  const r = await fetch(apiUrl, {headers:{"x-api-key":KEY}});
  const j = await r.json();

  let raw = j.data || j.statistics || j.stats || j || [];
  if(!Array.isArray(raw)) raw = [raw];

  // Normalize to simple home/away format for your match.html
  let home = {}, away = {};
  raw.forEach(s=>{
    let teamSide = (s.team?.name||s.team||'').toString().toLowerCase();
    // Highlightly sometimes returns array of stats per team
    let stats = s.statistics || s.stats || s || {};
    if(Array.isArray(stats)){
      stats.forEach(st=>{
        let k = (st.type||st.name||'').toLowerCase();
        let v = st.value ?? '';
        if(teamSide.includes('home') || s.side==='home' || raw.indexOf(s)===0) home[k]=v;
        else away[k]=v;
      });
    } else if(typeof stats==='object'){
      Object.keys(stats).forEach(k=>{
        let lk=k.toLowerCase();
        if(teamSide.includes('home') || raw.indexOf(s)===0) home[lk]=stats[k];
        else away[lk]=stats[k];
      });
    }
  });

  // If Highlightly returns already home/away object
  if(raw.length===0 && j.home){
    home=j.home; away=j.away;
  }

  const combined = [
    {label:"Possession", home:home['ball possession']||home['possession']||'50%', away:away['ball possession']||away['possession']||'50%'},
    {label:"Shots", home:home['total shots']||home['shots']||'0', away:away['total shots']||away['shots']||'0'},
    {label:"Shots on Target", home:home['shots on target']||'0', away:away['shots on target']||'0'},
    {label:"Corners", home:home['corner kicks']||home['corners']||'0', away
