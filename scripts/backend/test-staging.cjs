// Integration tests against a fixed, disposable staging project. Never production.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const REF='jyexohxixfuirvyqqwmf';
const url=`https://${REF}.supabase.co`;
const privateDir=process.argv[2];
if(!privateDir) throw new Error('Provide private staging credential directory');
const keys=JSON.parse(fs.readFileSync(path.join(privateDir,'api-keys.json')));
const anon=keys.find(k=>k.name==='anon').api_key;
const service=keys.find(k=>k.name==='service_role').api_key;
async function api(route,{token=service,key=anon,body,method=body?'POST':'GET',headers={},raw=false}={}){
 const r=await fetch(url+route,{signal:AbortSignal.timeout(30000),method,headers:{apikey:key,Authorization:`Bearer ${token}`,...(raw?{}:{'Content-Type':'application/json'}),...headers},body:body===undefined?undefined:raw?body:JSON.stringify(body)});
 const txt=await r.text();let data;try{data=JSON.parse(txt)}catch{data=txt}
 return {status:r.status,data};
}
function ok(r,expected){assert.ok(r.status>=200&&r.status<300,`HTTP ${r.status}: ${r.data?.code||r.data?.error_code||'request rejected'}`);if(expected!==undefined)assert.deepEqual(r.data,expected);return r.data;}
let checks=0;const users=[];
async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
(async()=>{
 try{
 const run=crypto.randomBytes(5).toString('hex');
 for(const name of ['a','b']){
  const email=`staging-${name}-${run}@example.test`,password=crypto.randomBytes(24).toString('base64url');
  const user=ok(await api('/auth/v1/admin/users',{key:service,body:{email,password,email_confirm:true}}));
  users.push({id:user.id,email,password});
  const session=ok(await api('/auth/v1/token?grant_type=password',{token:anon,body:{email,password}}));
  users.at(-1).token=session.access_token;
 }
 const [a,b]=users;
 await check('real Auth passwords issue distinct user JWTs',async()=>assert.notEqual(a.id,b.id));
 let patio;
 await check('authenticated owner creates Patio by UUID',async()=>{
  const rows=ok(await api('/rest/v1/fonditas?select=id,owner_id,nombre',{token:a.token,headers:{Prefer:'return=representation'},body:{nombre:'Patio de ensayo'}}));
  patio=rows[0];assert.equal(patio.owner_id,a.id);
 });
 await check('other account cannot update owner business',async()=>{
  const rows=ok(await api(`/rest/v1/fonditas?id=eq.${patio.id}&select=id,nombre`,{token:b.token,method:'PATCH',headers:{Prefer:'return=representation'},body:{nombre:'Intruso'}}));assert.deepEqual(rows,[]);
 });
 await check('ownership spoofing is rejected',async()=>{
  const r=await api('/rest/v1/fonditas',{token:a.token,body:{nombre:'Falso',owner_id:b.id}});assert.equal(r.status,403);
 });
 await check('legacy email is unavailable to app clients',async()=>{
  const r=await api('/rest/v1/fonditas?select=telefono',{token:a.token});assert.equal(r.status,403);
 });
 await check('anonymous discovery reads actual public fields',async()=>{
  const rows=ok(await api(`/rest/v1/fonditas?id=eq.${patio.id}&select=id,nombre,direccion,horario,tipo_negocio,pagos_efectivo,categorias`,{token:anon}));assert.equal(rows[0].nombre,'Patio de ensayo');
 });
 await check('menu and carta upserts use their real unique keys',async()=>{
  const menu={fondita_id:patio.id,fecha:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),secciones:{secciones:[]}};
  ok(await api('/rest/v1/menus?on_conflict=fondita_id,fecha',{token:a.token,body:menu,headers:{Prefer:'resolution=merge-duplicates'}}));
  for(let i=0;i<2;i++)ok(await api('/rest/v1/cartas?on_conflict=fondita_id',{token:a.token,body:{fondita_id:patio.id,secciones:{secciones:[]}},headers:{Prefer:'resolution=merge-duplicates'}}));
  assert.equal(ok(await api(`/rest/v1/cartas?fondita_id=eq.${patio.id}&select=id`,{token:a.token})).length,1);
 });
 await check('publication notifications validate owner and deduplicate without followers',async()=>{
  const body={fonditaId:patio.id,kind:'menu_published'};
  assert.equal((await api('/functions/v1/send-publication-notifications',{token:b.token,body})).status,403);
  assert.equal(ok(await api('/functions/v1/send-publication-notifications',{token:a.token,body})).delivered,0);
  assert.equal(ok(await api('/functions/v1/send-publication-notifications',{token:a.token,body})).deduplicated,true);
 });
 await check('paid-provider quota is service-only and enforces minute cap',async()=>{
  const body={p_user_id:a.id,p_feature:'read-menu'};
  assert.equal((await api('/rest/v1/rpc/consume_ai_request',{token:a.token,body})).status,403);
  assert.equal(ok(await api('/rest/v1/rpc/consume_ai_request',{key:service,body})),true);
  assert.equal(ok(await api('/rest/v1/rpc/consume_ai_request',{key:service,body})),true);
  assert.equal(ok(await api('/rest/v1/rpc/consume_ai_request',{key:service,body})),false);
 });
 await check('collection publication is atomic and rejects foreign replacement',async()=>{
  const body={p_collection_id:crypto.randomUUID(),p_title:'Lista ensayo',p_description:'',p_visibility:'public',p_fondita_ids:[patio.id]};
  assert.equal(ok(await api('/rest/v1/rpc/publish_collection',{token:a.token,body})),body.p_collection_id);
  assert.equal((await api('/rest/v1/rpc/publish_collection',{token:b.token,body})).status,403);
 });
 await check('reviews enforce server date and reject reply/moderation spoofing',async()=>{
  ok(await api('/rest/v1/user_profiles',{token:a.token,body:{user_id:a.id,display_name:'Ana ensayo',first_name:'Ana',last_name:'Ensayo',handle:'ensayo-'+run,setup_completed:true}}));
  const body={user_id:a.id,fondita_id:patio.id,stars:5,reasons:[],note:'Ensayo',visit_date:'2000-01-01',created_at:'2000-01-01T00:00:00Z'};
  const review=ok(await api('/rest/v1/reviews?select=id,visit_date,created_at',{token:a.token,body,headers:{Prefer:'return=representation'}}))[0];
  assert.notEqual(review.visit_date,'2000-01-01');assert.ok(!review.created_at.startsWith('2000'));
  assert.equal((await api('/rest/v1/reviews',{token:a.token,body})).status,409);
  assert.equal((await api('/rest/v1/reviews',{token:b.token,body:{...body,user_id:b.id,business_reply:'Respuesta falsa'}})).status,403);
  assert.equal((await api('/rest/v1/rpc/reply_to_review',{token:b.token,body:{target_review_id:review.id,reply_text:'Intruso'}})).status,403);
  ok(await api('/rest/v1/rpc/reply_to_review',{token:a.token,body:{target_review_id:review.id,reply_text:'Respuesta de ensayo'}}));
 });
 await check('reports and blocks respect the requesting account',async()=>{
  ok(await api('/rest/v1/content_reports',{token:a.token,body:{reporter_id:a.id,target_type:'patio',target_id:patio.id,reason:'other',details:'Ensayo'}}));
  assert.deepEqual(ok(await api('/rest/v1/content_reports?select=id',{token:b.token})),[]);
  ok(await api('/rest/v1/blocked_users',{token:a.token,body:{blocker_id:a.id,blocked_user_id:b.id}}));
  assert.deepEqual(ok(await api('/rest/v1/blocked_users?select=blocked_user_id',{token:b.token})),[]);
 });
 const image=fs.readFileSync(path.resolve(__dirname,'../../assets/images/p-icon.png'));
 await check('Storage allows own folder and rejects foreign folder',async()=>{
  for(const bucket of ['avatars','business-logos']){
   ok(await api(`/storage/v1/object/${bucket}/${a.id}/stage.png`,{token:a.token,body:image,raw:true,headers:{'Content-Type':'image/png','x-upsert':'true'}}));
   const r=await api(`/storage/v1/object/${bucket}/${a.id}/intruder.png`,{token:b.token,body:image,raw:true,headers:{'Content-Type':'image/png'}});
   assert.ok(r.status>=400);
  }
 });
 await check('Edge gateway rejects requests without user JWT',async()=>{
  for(const f of ['read-menu','smart-setup','search-intent','send-publication-notifications','delete-account']){
   const r=await fetch(url+'/functions/v1/'+f,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,401,`${f}: ${r.status}`);
  }
 });
 await check('account deletion clears Auth, owned SQL and Storage',async()=>{
  ok(await api('/functions/v1/delete-account',{token:a.token,body:{userId:b.id}}),{deleted:true});
  const auth=await api(`/auth/v1/admin/users/${a.id}`,{key:service});assert.equal(auth.status,404);
  assert.deepEqual(ok(await api(`/rest/v1/fonditas?id=eq.${patio.id}&select=id`,{key:service})),[]);
  for(const bucket of ['avatars','business-logos']) assert.deepEqual(ok(await api(`/storage/v1/object/list/${bucket}`,{key:service,body:{prefix:a.id,limit:100}})),[]);
  assert.equal((await api(`/auth/v1/admin/users/${b.id}`,{key:service})).status,200);
 });
 console.log(`RESULT ${checks} live staging integration checks passed; no production accessed; no provider secrets or paid AI requests.`);
 }finally{
  for(const user of users)await api(`/auth/v1/admin/users/${user.id}`,{key:service,method:'DELETE'});
 }
})().catch(e=>{console.error('FAIL '+e.message);process.exitCode=1;});
