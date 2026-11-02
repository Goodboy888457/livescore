export async function onRequest(context){
 try{
  const apiKey = context.env.APISPORT_API_KEY;
  const url = new URL(context.request.url);
  let id = url.searchParams.get('id');
  if(!id) return new Response(JSON.stringify({ data: [] }), { headers: { 'Content-Type': 'application/json' } });
  let res = await fetch(`https://api.apisport.online/fixtures/headtohead?h2h=${id}&last=5`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
  let json = await res.json();
  let data = json.response || json.data || [];
  return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
 }catch(e){
  return new Response(JSON.stringify({ data: [] }), { headers: { 'Content-Type': 'application/json' } });
 }
}
