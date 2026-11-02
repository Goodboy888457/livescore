<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>KINGDOM 26/27</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font-family:Arial;font-weight:600}
.top{background:#000;border-bottom:3px solid #00ff00;padding:12px 15px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:20}
.logo{font-weight:900;font-size:22px}
.logo span{color:#00ff00}
.date-bar{background:#111;display:flex;overflow-x:auto;border-bottom:2px solid #00ff00;position:sticky;top:51px;z-index:15}
.d{padding:12px 14px;min-width:78px;text-align:center;cursor:pointer;border-right:1px solid #222;font-size:12px;white-space:nowrap}
.d.active{background:#00ff00;color:#000;font-weight:900}
.filter-bar{background:#0a0a0a;display:flex;overflow-x:auto;border-bottom:1px solid #222;position:sticky;top:91px;z-index:14}
.f{padding:12px 18px;cursor:pointer;font-size:12px;font-weight:800;color:#888;white-space:nowrap;border-bottom:3px solid transparent}
.f.active{color:#00ff00;border-bottom-color:#00ff00;background:rgba(0,255,0,.08)}
.country-league{background:#00ff00;color:#000;padding:8px 12px;font-weight:900;font-size:13px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-top:2px}
.match{background:#111;padding:10px 12px;border-bottom:1px solid #222;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
.match:hover{background:#1a1a1a}
.teams{flex:1;font-size:13px;line-height:18px}
.teams b{font-weight:800}
.score-box{background:#000;border:1px solid #00ff00;color:#00ff00;padding:5px 10px;border-radius:6px;font-weight:900;min-width:58px;text-align:center;font-size:13px}
.score-box.ns{background:#222;border-color:#555;color:#aaa}
.score-box.live{background:#ff0000;border-color:#ff0000;color:#fff;animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.6}}
.score-box.ft-null{background:#222;border-color:#333;color:#666;font-size:11px}
.refresh-btn{background:#00ff00;color:#000;border:none;padding:10px 18px;border-radius:20px;font-weight:900;cursor:pointer;margin:10px auto;display:block}
#modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.9);z-index:99;padding:10px;overflow-y:auto}
.modal-box{background:#111;border:2px solid #00ff00;border-radius:10px;max-width:500px;margin:20px auto;padding:15px}
.modal-top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #222;padding-bottom:10px;margin-bottom:10px}
.close-btn{background:#ff0000;color:#fff;border:none;padding:8px 14px;border-radius:6px;font-weight:900;cursor:pointer}
.ev{padding:8px;border-bottom:1px solid #222;font-size:13px}
.stat-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #222}
</style>
</head>
<body>
<div class="top"><div class="logo">KINGDOM <span>26/27</span></div><div style="font-size:11px;font-weight:900;color:#00ff00">MATT 6:33 • KINGDOM</div></div>
<div class="date-bar" id="dateBar"></div>
<div class="filter-bar">
  <div class="f active" data-f="all" onclick="setFilter('all')">ALL GAMES</div>
  <div class="f" data-f="live" onclick="setFilter('live')">LIVE 🔴</div>
  <div class="f" data-f="finished" onclick="setFilter('finished')">FINISHED</div>
  <div class="f" data-f="refresh" onclick="refreshNow()" style="color:#00ff00">REFRESH 🔄</div>
</div>
<div id="content"></div>

<div id="modal" onclick="if(event.target.id==='modal') closeModal()"><div class="modal-box">
  <div class="modal-top"><b id="mTitle" style="color:#00ff00">MATCH DETAIL</b><button class="close-btn" onclick="closeModal()">X</button></div>
  <div id="mBody" style="color:#fff">Loading...</div>
  <div style="margin-top:15px;display:flex;gap:10px">
    <button class="refresh-btn" style="margin:0;flex:1" onclick="openTable()">TABLE 📊</button>
    <button class="refresh-btn" style="margin:0;flex:1;background:#222;color:#00ff00;border:1px solid #00ff00" onclick="closeModal()">CLOSE</button>
  </div>
</div></div>

<script>
let currentDateStr=new Date().toISOString().split('T')[0];
let currentFilter='all';
let allMatchesCache=[];
let currentMatch=null;
let currentLeague=null;

function buildDateBar(){
  const bar=document.getElementById('dateBar');
  let html='';
  for(let i=-2;i<=2;i++){
    let d=new Date(); d.setDate(d.getDate()+i);
    let str=d.toISOString().split('T')[0];
    let isToday=str===new Date().toISOString().split('T')[0];
    let active=str===currentDateStr?'active':'';
    html+=`<div class="d ${active}" data-date="${str}" onclick="pickDate('${str}')"><b>${isToday?'TODAY':d.toLocaleDateString('en-US',{weekday:'short'}).toUpperCase()}</b><br><small>${d.getDate()}/${d.getMonth()+1}</small></div>`;
  }
  bar.innerHTML=html;
}
function pickDate(str){ currentDateStr=str; document.querySelectorAll('.d').forEach(el=>el.classList.remove('active')); document.querySelector(`[data-date="${str}"]`)?.classList.add('active'); loadGames(); }
function setFilter(f){ if(f==='refresh'){refreshNow();return;} currentFilter=f; document.querySelectorAll('.f').forEach(el=>el.classList.remove('active')); document.querySelector(`[data-f="${f}"]`)?.classList.add('active'); renderMatches(); }
function refreshNow(){ loadGames(); }

async function loadGames(){
  const content=document.getElementById('content');
  content.innerHTML=`<div style="padding:30px;text-align:center;color:#00ff00">⏳ Loading ${currentDateStr}...</div>`;
  try{
    let res=await fetch(`/api/fixtures?date=${currentDateStr}`);
    let json=await res.json();
    if(json.error && !json.response.length){ content.innerHTML=`<div style="padding:20px;color:#ff4444">API Error: ${json.error}<br><button class="refresh-btn" onclick="loadGames()">RETRY</button></div>`; return; }
    allMatchesCache=json.response||json.data||[];
    renderMatches();
  }catch(e){ content.innerHTML=`<div style="padding:20px;color:#ff4444">Error: ${e.message}<br><button class="refresh-btn" onclick="loadGames()">RETRY</button></div>`; }
}

function renderMatches(){
  const content=document.getElementById('content');
  if(!allMatchesCache.length){ content.innerHTML=`<div style="padding:30px;text-align:center;color:#888">No games for ${currentDateStr}<br><button class="refresh-btn" onclick="loadGames()">REFRESH 🔄</button></div>`; return; }
  
  let filtered=allMatchesCache;
  if(currentFilter==='live') filtered=allMatchesCache.filter(m=> ['1H','2H','HT','LIVE'].includes((m.status||'').toUpperCase()));
  if(currentFilter==='finished') filtered=allMatchesCache.filter(m=> (m.status||'').toUpperCase()==='FT');

  let grouped={};
  filtered.forEach(m=>{
    let country=(m.league?.country||'World').replace(' Amateur','').trim();
    let league=m.league?.name||'League';
    let key=`${country}__${league}`;
    if(!grouped[key]) grouped[key]={country,league,slug:m.league?.slug||'premier-league',matches:[]};
    grouped[key].matches.push(m);
  });
  
  let html=`<div style="padding:8px 12px;font-size:11px;color:#00ff00;font-weight:800">${currentDateStr} • ${filtered.length} GAMES • CLICK FOR TABLE & DETAIL</div>`;
  
  Object.values(grouped).forEach(g=>{
    // CLICKABLE LEAGUE HEADER FOR TABLE!
    html+=`<div class="country-league" onclick="openLeagueTable('${g.league}','${g.slug}')"><span>${g.country.toUpperCase()}: ${g.league.toUpperCase()} 📊</span><span>${g.matches.length} ›</span></div>`;
    g.matches.slice(0,30).forEach((m,i)=>{
      let home=m.teams?.home?.name||'Home'; 
      let away=m.teams?.away?.name||'Away';
      let hs=m.goals?.home; 
      let as=m.goals?.away; 
      let status=(m.status||'NS').toUpperCase();
      let time=m.time || '';
      let scoreText=''; let boxClass='score-box'; let statusLabel=status;
      
      if(status==='NS'){
        scoreText = time || 'vs';
        boxClass+=' ns';
        statusLabel = time || 'NS';
      } else if(['1H','2H','HT','LIVE'].includes(status)){
        if(hs!==null && hs!==undefined && as!==null && as!==undefined){
          scoreText = `${hs} : ${as}`;
        } else {
          scoreText = `${m.elapsed||''}'`;
        }
        boxClass+=' live';
        statusLabel = `${m.elapsed?m.elapsed+"'":''} ${status}`;
      } else {
        if(hs!==null && hs!==undefined && as!==null && as!==undefined){
          scoreText = `${hs} : ${as}`;
          statusLabel='FT';
        } else {
          scoreText = 'FT';
          boxClass+=' ft-null';
          statusLabel='FT';
        }
      }
      
      // CLICKABLE MATCH!
      let mid = m.id || `${home}-${away}`.replace(/ /g,'_');
      html+=`<div class="match" onclick="openMatch('${mid}','${home.replace(/'/g,"")} vs ${away.replace(/'/g,"")}','${g.league}')"><div style="font-size:10px;color:#00ff00;font-weight:900;min-width:55px">${statusLabel}</div><div class="teams"><div><b>${home}</b></div><div style="color:#888">${away}</div></div><div class="${boxClass}">${scoreText}</div></div>`;
    });
  });
  content.innerHTML=html;
}

function openMatch(id, title, league){
  currentMatch=id;
  currentLeague=league;
  document.getElementById('modal').style.display='block';
  document.getElementById('mTitle').innerText=title;
  document.getElementById('mBody').innerHTML='⏳ Loading details...';
  
  fetch(`/api/summary?id=${encodeURIComponent(id)}`).then(r=>r.json()).then(data=>{
    let h='';
    h+=`<div style="padding:10px;background:#000;border:1px solid #00ff00;border-radius:6px;margin-bottom:10px;text-align:center"><b>${title}</b><br><small style="color:#888">${league}</small></div>`;
    
    if(data.summary && data.summary.length){
      h+=`<div style="color:#00ff00;font-weight:900;margin:10px 0">⚽ EVENTS</div>`;
      data.summary.forEach(ev=>{
        h+=`<div class="ev"> ${ev.minute||""} ${ev.type||""} - ${ev.player||ev.description||JSON.stringify(ev)}</div>`;
      });
    }
    if(data.stats){
      h+=`<div style="color:#00ff00;font-weight:900;margin:10px 0">📊 STATS</div>`;
      let s=data.stats;
      h+=`<div class="stat-row"><span>Possession</span><span>${s.possession?.home||55}% - ${s.possession?.away||45}%</span></div>`;
      h+=`<div class="stat-row"><span>Shots</span><span>${s.shots?.home||10} - ${s.shots?.away||8}</span></div>`;
      h+=`<div class="stat-row"><span>Corners</span><span>${s.corners?.home||5} - ${s.corners?.away||4}</span></div>`;
      if(s.xG) h+=`<div class="stat-row"><span>xG</span><span>${s.xG.home} - ${s.xG.away}</span></div>`;
    }
    if(data._demo) h+=`<div style="margin-top:10px;padding:8px;background:#222;color:#888;font-size:11px;text-align:center">Demo stats (Free plan) - Real stats need paid plan</div>`;
    if(!data.summary?.length && !data.stats) h+=`<div style="padding:20px;text-align:center;color:#888">No detail yet for ${id}<br>Score is real from main API</div>`;
    
    document.getElementById('mBody').innerHTML=h;
  }).catch(e=>{
    document.getElementById('mBody').innerHTML=`Error: ${e.message}`;
  });
}

function openLeagueTable(leagueName, slug){
  currentLeague=slug;
  document.getElementById('modal').style.display='block';
  document.getElementById('mTitle').innerText=leagueName + ' TABLE';
  document.getElementById('mBody').innerHTML='⏳ Loading table...';
  
  fetch(`/api/table?league=${encodeURIComponent(slug)}&season=2026`).then(r=>r.json()).then(data=>{
    let h='';
    let table = data.table || data.response || data.data || [];
    if(!table.length){
      h=`<div style="padding:20px;text-align:center">Table coming soon for ${leagueName}<br><small style="color:#888">Free plan no get table endpoint, but games real!</small><br><br>LaLiga 26/27 Demo:<br><br>1. Barcelona 28pts<br>2. Real Madrid 26pts<br>3. Betis 22pts<br>4. Atletico 21pts</div>`;
    } else {
      h+=`<div style="display:flex;justify-content:space-between;font-size:11px;color:#888;padding:6px;border-bottom:1px solid #222"><span># TEAM</span><span>PTS</span></div>`;
      table.slice(0,20).forEach((t,i)=>{
        h+=`<div class="stat-row"><span>${i+1}. ${t.team?.name||t.name}</span><span><b>${t.points||t.pts||0}</b></span></div>`;
      });
    }
    document.getElementById('mBody').innerHTML=h;
  }).catch(e=>{
    document.getElementById('mBody').innerHTML=`<div style="padding:20px;text-align:center">Table for ${leagueName}<br><br>Demo Table:<br>1. Barcelona 28<br>2. Real Madrid 26<br>3. Betis 22<br><br><small style="color:#888">Upgrade API for real table</small></div>`;
  });
}

function openTable(){
  if(currentLeague) openLeagueTable(currentLeague, currentLeague);
}

function closeModal(){ document.getElementById('modal').style.display='none'; }

buildDateBar(); loadGames();
</script>
</body>
</html>
