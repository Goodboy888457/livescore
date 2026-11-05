document.getElementById('h2h').innerHTML=`<div class="card"><div class="row head"><span>LOADING LAST 5 H2H...</span></div></div>`;
try{
let r=await fetch(`/api/h2h?team1=${hid}&team2=${aid}`);
let j=await r.json();
console.log("H2H RAW", j);
let games=j.data||j||[];
let last5=games.slice(0,5);
let html=`<div class="card"><div class="row head"><span>LAST 5 - ${home} vs ${away}</span></div>`;
if(last5.length>0){
last5.forEach(g=>{
let homeTeam=g.home_team||g.homeTeam||g.home||'Home';
let awayTeam=g.away_team||g.awayTeam||g.away||'Away';
// FIX NULL-NULL - TRY ALL SCORE NAMES
let hS=g.home_score??g.homeScore??g.score_home??g.home_goals??g.goals_home??g.h_score??g.ft_home??g.result_home??g.score?.home??null;
let aS=g.away_score??g.awayScore??g.score_away??g.away_goals??g.goals_away??g.a_score??g.ft_away??g.result_away??g.score?.away??null;
// If still null, try parse from score string "2-1"
if((hS==null||aS==null) && g.score){let parts=(g.score+"").split(/[-:]/); if(parts.length>=2){hS=parts[0].trim(); aS=parts[1].trim();}}
if((hS==null||aS==null) && g.result){let parts=(g.result+"").split(/[-:]/); if(parts.length>=2){hS=parts[0].trim(); aS=parts[1].trim();}}
if((hS==null||aS==null) && g.ft_score){let parts=(g.ft_score+"").split(/[-:]/); if(parts.length>=2){hS=parts[0].trim(); aS=parts[1].trim();}}
hS=hS??'?'; aS=aS??'?';
let d=(g.datetime||g.date||g.kickoff||'').split(' ')[0]||'';
let winNum=parseInt(hS); let winNumA=parseInt(aS);
let win=winNum>winNumA?homeTeam:winNumA>winNum?awayTeam:'DRAW';
html+=`<div class="row"><span style="font-size:11px;color:#888">${d}<br><b style="color:#fff;font-size:13px">${homeTeam} ${hS} - ${aS} ${awayTeam}</b></span><span style="color:${win=='DRAW'?'#888':'#00ff66'};font-weight:900;font-size:11px">${win}</span></div>`;
});
}else{
html+=`<div style="padding:20px;color:#888;text-align:center">No H2H history<br>Try Premier League big teams</div>`;
}
html+='</div>';
document.getElementById('h2h').innerHTML=html;
}catch(e){
document.getElementById('h2h').innerHTML=`<div class="card">Error: ${e.message}<br>Open F12 Console see H2H RAW</div>`;
}
