const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();

const API_KEY = process.env.SPORTAPI_KEY || process.env.API_KEY || "YOUR_API_KEY_HERE";
const BASE = "https://sportapi.ai/api";

app.use(express.static(path.join(__dirname)));
app.use(express.json());

async function apiFetch(url){
  const res = await fetch(url, { headers: { "X-Api-Key": API_KEY } });
  const text = await res.text();
  try{ return JSON.parse(text); }catch{ return { success:false, raw:text }; }
}

// List fixtures by date
app.get('/api/fixtures', async (req,res)=>{
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const data = await apiFetch(`${BASE}/fixtures/date/${date}`);
  res.json(data);
});

// Single fixture details
app.get('/api/fixture', async (req,res)=>{
  const id = req.query.id;
  if(!id) return res.status(400).json({ success:false, error:"id required" });
  const data = await apiFetch(`${BASE}/fixtures/${id}`);
  res.json(data);
});

app.get('/api/fixture/events', async (req,res)=>{
  const data = await apiFetch(`${BASE}/fixtures/${req.query.id}/events`);
  res.json(data);
});
app.get('/api/fixture/stats', async (req,res)=>{
  const data = await apiFetch(`${BASE}/fixtures/${req.query.id}/stats`);
  res.json(data);
});
app.get('/api/fixture/lineups', async (req,res)=>{
  const data = await apiFetch(`${BASE}/fixtures/${req.query.id}/lineups`);
  res.json(data);
});
app.get('/api/standings/:leagueId', async (req,res)=>{
  const data = await apiFetch(`${BASE}/standings/${req.params.leagueId}`);
  res.json(data);
});
app.get('/api/h2h', async (req,res)=>{
  const { team1, team2 } = req.query;
  const data = await apiFetch(`${BASE}/fixtures/h2h/${team1}/${team2}`);
  res.json(data);
});

app.get('/match.html', (req,res)=>{ res.sendFile(path.join(__dirname,'match.html')); });
app.get('/', (req,res)=>{ res.sendFile(path.join(__dirname,'index.html')); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`LiveScore running on port ${PORT}`));
