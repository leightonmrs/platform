import assert from 'node:assert/strict';
import { Miniflare } from 'miniflare';
import { readFile,readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve('dist/server');
const paths=['index.js',...(await readdir(root,{recursive:true})).filter(p=>/\.m?js$/.test(p)&&p!=='index.js')];
const mf=new Miniflare({modules:paths.map(p=>({type:'ESModule',path:resolve(root,p)})),modulesRoot:root,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
const database=await mf.getD1Database('DB');
const migration=await readFile('drizzle/0000_woozy_venom.sql','utf8');
for(const sql of migration.split('--> statement-breakpoint')){if(sql.trim())await database.prepare(sql.trim()).run();}
const base='https://academy.test';
try {
const owner={'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'owner@example.test'};
const student={'oai-authenticated-user-id':'qa-student','oai-authenticated-user-email':'student@example.test'};
let checks=0;
async function request(path,method='GET',body,user=owner,extra={}){const outgoing=new Request(base+'/api/'+path,{method,headers:{...user,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...extra},body:body?(body instanceof FormData?body:JSON.stringify(body)):undefined});const r=await mf.dispatchFetch(outgoing.url,{method,headers:Object.fromEntries(outgoing.headers),body:body?new Uint8Array(await outgoing.arrayBuffer()):undefined});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data};}
function check(ok,label){assert.ok(ok,label);checks++;console.log('PASS',label);}
const anon=await request('state','GET',undefined,{});if(anon.status!==200)console.log('Preview failure',anon);check(anon.status===200&&!anon.data.isOwner&&!anon.data.user,'anonymous preview');check(anon.data.course.modules.at(-1).lessons.at(-1).questions.every(q=>!('correct'in q)),'answers hidden from preview');
let state=(await request('state')).data;check(state.isOwner&&state.course.modules.length===6,'owner initializes course');
const other=(await request('state','GET',undefined,student)).data;check(!other.isOwner&&other.course.modules.at(-1).lessons.at(-1).questions.every(q=>!('correct'in q)),'student cannot access answer key');
check((await request('course','PUT',{course:state.course,revision:state.revision},student)).status===403,'student cannot edit course');
check((await request('progress','POST',{lessonId:'l1',completed:true},{})).status===401,'anonymous writes denied');
check((await request('progress','POST',{lessonId:'l1',completed:true},owner,{Origin:'https://other.example.test'})).status===403,'cross-origin writes denied');
await request('notes','PUT',{lessonId:'l1',body:'Личная тестовая заметка'});check((await request('state')).data.notes.l1==='Личная тестовая заметка','notes persist');check(!(await request('state','GET',undefined,student)).data.notes.l1,'notes isolated per user');
await request('progress','POST',{lessonId:'l1',completed:true});await request('progress','POST',{lessonId:'l1',completed:true});check((await request('state')).data.completed.filter(id=>id==='l1').length===1,'completion is idempotent');
check((await request('progress','POST',{lessonId:'l12',completed:true})).status===400,'quiz completion cannot be forged');check((await request('certificate')).status===403,'certificate locked until complete');
check((await request('quiz','POST',{lessonId:'l12',answers:{}})).status===400,'incomplete quiz rejected');
const quiz=state.course.modules.at(-1).lessons.at(-1),answers=Object.fromEntries(quiz.questions.map(q=>[q.id,q.correct]));const pass=await request('quiz','POST',{lessonId:'l12',answers});check(pass.status===200&&pass.data.score===100&&pass.data.passed,'server grades correct answers');
const wrong=Object.fromEntries(quiz.questions.map(q=>[q.id,(q.correct+1)%q.options.length]));const fail=await request('quiz','POST',{lessonId:'l12',answers:wrong});check(fail.data.score===0&&!fail.data.passed&&(await request('state')).data.completed.includes('l12'),'unsuccessful retry preserves prior pass');
check((await request('course','PUT',{course:state.course,revision:state.revision-1})).status===409,'stale author revision rejected');
const invalid=structuredClone(state.course);invalid.modules[0].lessons[0].resources[0].url='javascript:alert(1)';check((await request('course','PUT',{course:invalid,revision:state.revision})).status===400,'unsafe resource links rejected');
const saved=await request('course','PUT',{course:state.course,revision:state.revision});check(saved.status===200&&saved.data.revision===state.revision+1,'author changes persist');
const f=new FormData();f.append('file',new Blob(['%PDF-1.4\nQA only\n%%EOF'],{type:'application/pdf'}),'qa.pdf');const uploaded=await request('upload','POST',f);check(uploaded.status===200&&uploaded.data.url.startsWith('/api/files/'),'attachment upload');const file=await request('files/'+uploaded.data.id);check(file.status===200&&file.data.startsWith('%PDF-1.4'),'attachment retrieval');check((await request('files/'+uploaded.data.id,'GET',undefined,{})).status===401,'private attachments require sign in');
for(const l of state.course.modules.flatMap(m=>m.lessons).filter(l=>l.type!=='quiz'))await request('progress','POST',{lessonId:l.id,completed:true});const cert=await request('certificate');check(cert.status===200&&cert.data.includes('Подтверждение завершения курса'),'certificate unlocks after all requirements');
const modified=structuredClone(state.course);modified.passScore=79;const reset=await request('course','PUT',{course:modified,revision:saved.data.revision});check(reset.data.resetQuizResults&&!(await request('state')).data.completed.includes('l12'),'assessment change invalidates old pass');
await request('course','PUT',{course:state.course,revision:reset.data.revision});
console.log(`${checks} smoke checks passed.`);

} finally { await mf.dispose(); }
