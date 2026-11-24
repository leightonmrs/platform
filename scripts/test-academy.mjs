import assert from 'node:assert/strict';
import { Miniflare } from 'miniflare';
import { readFile,readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve('dist/server');
const paths=['index.js',...(await readdir(root,{recursive:true})).filter(p=>/\.m?js$/.test(p)&&p!=='index.js')];
const mf=new Miniflare({modules:paths.map(p=>({type:'ESModule',path:resolve(root,p)})),modulesRoot:root,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
const database=await mf.getD1Database('DB');
for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){const migration=await readFile('drizzle/'+file,'utf8');for(const sql of migration.split('--> statement-breakpoint')){if(sql.trim())await database.prepare(sql.trim()).run();}}
const base='https://academy.test';
try {
const owner={'oai-authenticated-user-id':'qa-owner','oai-authenticated-user-email':'owner@example.test'};
const student={'oai-authenticated-user-id':'qa-student','oai-authenticated-user-email':'student@example.test'};
let checks=0;
async function request(path,method='GET',body,user=owner,extra={}){const outgoing=new Request(base+'/api/'+path,{method,headers:{...user,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...extra},body:body?(body instanceof FormData?body:JSON.stringify(body)):undefined});const r=await mf.dispatchFetch(outgoing.url,{method,headers:Object.fromEntries(outgoing.headers),body:body?new Uint8Array(await outgoing.arrayBuffer()):undefined});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data,headers:Object.fromEntries(r.headers)};}
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

const catalog=(await request('catalog')).data;
check(catalog.items.length===1&&catalog.items[0].id==='main','existing course preserved in catalogue');
check(state.course.organization==='Институт Лабораторной Медицины КАМЛАБ','platform organization renamed');
check((await request('catalog','POST',{title:'Student course'},student)).status===403,'students cannot create courses');
const created=await request('catalog','POST',{title:'Контроль качества'});check(created.status===201,'author can add another course');
const cid=created.data.id,route=p=>`${p}?courseId=${cid}`;
const draft=(await request(route('state'))).data;
check(!draft.course.commerce.published,'new course starts as draft');
check((await request('catalog','GET',undefined,student)).data.items.length===1,'draft hidden from students');
check((await request(route('state'),'GET',undefined,student)).status===404,'draft lessons blocked server-side');
const paidCourse=structuredClone(state.course);paidCourse.title='Контроль качества';paidCourse.commerce={priceKzt:15000,paymentUrl:'',published:true,category:'Менеджмент качества'};
let put=await request(route('course'),'PUT',{course:paidCourse,revision:draft.revision});check(put.status===200,'independent course content saved');
check((await request(route('state'),'GET',undefined,student)).status===402,'unpaid course content blocked');
check((await request(route('progress'),'POST',{lessonId:'l1',completed:true},student)).status===402,'unpaid progress writes blocked');
check((await request('enroll','POST',{courseId:cid},student)).status===402,'paid enrollment cannot be forged');
check((await request('orders','POST',{courseId:cid},student)).status===409,'checkout disabled until payment link configured');
paidCourse.commerce.paymentUrl='https://payments.example.test/checkout';put=await request(route('course'),'PUT',{course:paidCourse,revision:put.data.revision});check(put.status===200,'author can configure payment link');
const attachment=new FormData();attachment.append('file',new Blob(['%PDF-1.4\nCourse private\n%%EOF'],{type:'application/pdf'}),'private.pdf');const priv=await request(route('upload'),'POST',attachment);check(priv.status===200,'file attached to selected course');
check((await request('files/'+priv.data.id,'GET',undefined,student)).status===403,'paid attachments protected');
const order=await request('orders','POST',{courseId:cid},student);check(order.status===201&&order.data.amount_kzt===15000,'checkout stores authoritative price');
const repeated=await request('orders','POST',{courseId:cid},student);check(repeated.data.id===order.data.id,'pending order reused');
check((await request(route('state'),'GET',undefined,student)).status===402,'creating order does not grant course access');
check((await request('orders','PATCH',{orderId:order.data.id,action:'paid'},student)).status===403,'student cannot confirm own payment');
check((await request('orders','PATCH',{orderId:order.data.id,action:'paid'})).status===200,'author confirms verified payment');
const unlocked=await request(route('state'),'GET',undefined,student);check(unlocked.status===200&&unlocked.data.completed.length===0,'confirmed payment grants clean course access');
check((await request('files/'+priv.data.id,'GET',undefined,student)).status===200,'paid attachment unlocked with enrollment');
await request(route('notes'),'PUT',{lessonId:'l1',body:'Paid course note'});
check((await request('state')).data.notes.l1==='Личная тестовая заметка','existing notes unaffected by another course');
check((await request(route('state'))).data.notes.l1==='Paid course note','notes isolated by course despite matching lesson IDs');
check((await request(route('state'))).data.completed.length===0,'completion isolated by course');
check((await request(route('state'))).data.attempts.length===0,'quiz history isolated by course');
check((await request(route('certificate'))).status===403,'existing completion cannot unlock another course certificate');
check((await request('orders','GET',undefined,{})).status===401,'order history requires authentication');
const ownedOrders=(await request('orders','GET',undefined,student)).data;check(ownedOrders.items.length===1&&ownedOrders.items[0].status==='paid','learner sees confirmed own order');
const outsider={'oai-authenticated-user-id':'qa-outsider','oai-authenticated-user-email':'outsider@example.test'};
check((await request('orders','GET',undefined,outsider)).data.items.length===0,'order history isolated by user');
check((await request('state')).data.course.modules.length===6,'original PCR programme preserved after catalogue operations');

const videoForm=new FormData();videoForm.append('file',new Blob(['0123456789abcdefghijklmnopqrstuvwxyz'],{type:'video/mp4'}),'lecture.mp4');
const videoUpload=await request('upload','POST',videoForm);check(videoUpload.status===200&&videoUpload.data.type==='video/mp4','video upload accepted');
let videoState=(await request('state')).data;videoState.course.modules[0].lessons[0].type='video';videoState.course.modules[0].lessons[0].videoUrl=videoUpload.data.url;videoState.course.modules[0].lessons[0].videoAutoplay=true;
check((await request('course','PUT',{course:videoState.course,revision:videoState.revision})).status===200,'video and autoplay settings saved');
const videoLesson=(await request('state')).data.course.modules[0].lessons[0];check(videoLesson.type==='video'&&videoLesson.videoAutoplay===true&&videoLesson.videoUrl===videoUpload.data.url,'video lesson persists with autoplay');
const videoRead=await request('files/'+videoUpload.data.id,'GET',undefined,student);check(videoRead.status===200&&videoRead.headers['content-type']==='video/mp4'&&videoRead.headers['content-disposition'].startsWith('inline'),'uploaded video streams inline');
const videoRange=await request('files/'+videoUpload.data.id,'GET',undefined,student,{Range:'bytes=2-6'});check(videoRange.status===206&&String(videoRange.data)==='23456'&&videoRange.headers['content-range']==='bytes 2-6/36','video byte ranges support seeking');

console.log(`${checks} smoke checks passed.`);

} finally { await mf.dispose(); }
