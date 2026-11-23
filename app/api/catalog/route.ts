import { getChatGPTUser } from '../../chatgpt-auth';
import { allLessons,commerce,lessonKey,PLATFORM_NAME,type Course,type CatalogItem } from '../../course';
import { db,json,fail,ensureMain,hasAccess,parseCourse,requirePlatformOwner,sameOrigin,type CourseRecord } from '../../server';
export const dynamic='force-dynamic';
export async function GET(){try{
 const user=await getChatGPTUser(),main=await ensureMain(user),isOwner=!!user&&main?.owner_id===user.userId;
 const rows=(await db().prepare('SELECT id,owner_id,data,revision FROM courses ORDER BY CASE WHEN id=\'main\' THEN 0 ELSE 1 END,updated_at DESC').all()).results as CourseRecord[];
 const progress=user?(await db().prepare('SELECT lesson_id FROM progress WHERE user_id=?').bind(user.userId).all()).results as any[]:[];
 const enrolled=user?(await db().prepare('SELECT course_id FROM enrollments WHERE user_id=?').bind(user.userId).all()).results as any[]:[];
 const items:CatalogItem[]=[];
 for(const row of rows){const c=parseCourse(row),m=commerce(c);if(!isOwner&&!m.published)continue;const lessons=allLessons(c);items.push({id:row.id,title:c.title,subtitle:c.subtitle,author:c.author,level:c.level,category:m.category,priceKzt:m.priceKzt,published:m.published,modules:c.modules.length,lessons:lessons.length,minutes:lessons.reduce((n,l)=>n+l.minutes,0),access:await hasAccess(row,user),enrolled:enrolled.some(x=>x.course_id===row.id),paymentReady:!!m.paymentUrl,completed:lessons.filter(l=>progress.some(p=>p.lesson_id===lessonKey(row.id,l.id))).length,moduleTitles:c.modules.map(m=>m.title)});}
 return json({items,isOwner,user:user?{name:user.displayName,email:user.email}:null});
 }catch(e){return fail(e);}}
export async function POST(req:Request){try{
 sameOrigin(req);const {user}=await requirePlatformOwner();const body=await req.json() as any;
 if(typeof body.title!=='string'||!body.title.trim()||body.title.length>250)return json({error:'Укажите название курса — до 250 символов.'},400);
 const id=crypto.randomUUID(),lesson=crypto.randomUUID(),module=crypto.randomUUID();
 const c:Course={title:body.title.trim(),subtitle:'',organization:PLATFORM_NAME,author:'Учебная редакция',level:'Базовый уровень',passScore:80,commerce:{priceKzt:0,paymentUrl:'',published:false,category:'Лабораторная диагностика'},modules:[{id:module,title:'Первый модуль',description:'',lessons:[{id:lesson,title:'Первый урок',type:'reading',minutes:5,body:'',videoUrl:'',resources:[],questions:[]}]}]};
 await db().prepare('INSERT INTO courses (id,owner_id,data,revision,updated_at) VALUES (?,?,?,?,?)').bind(id,user.userId,JSON.stringify(c),1,new Date().toISOString()).run();return json({id},201);
 }catch(e){return fail(e);}}
