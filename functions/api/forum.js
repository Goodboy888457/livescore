export async function onRequestGet({env}){
 const {results} = await env.DB.prepare("SELECT * FROM threads ORDER BY id DESC LIMIT 100").all();
 return new Response(JSON.stringify({data:results}),[STRIPPED]
}
export async function onRequestPost({request,env}){
 const d=await request.json();
 await env.DB.prepare("INSERT INTO threads (title,content,section,author) VALUES (?,?,?,?)").bind(d.title,d.content,d.section||'General',d.author||'Guest').run();
 return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
}
