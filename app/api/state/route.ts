import { getChatGPTUser } from '../../chatgpt-auth';
import { allLessons,lessonKey } from '../../course';
import { db,json,ensureMain,accessibleCourse,fail } from '../../server';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 const user=await getChatGPTUser();await ensureMain(user);const {id,row,course}=await accessibleCourse(req,user),isOwner=!!user&&row?.owner_id===user.userId;
 let completed:string[]=[],notes:Record<string,string>={},attempts:any[]=[],learners:any[]=[];
 const ls=allLessons(course),keys=new Map(ls.map(l=>[lessonKey(id,l.id),l.id]));
 if(user){
  const now=new Date().toISOString();await db().batch([
   db().prepare('INSERT INTO learners (user_id,name,joined_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name').bind(user.userId,user.displayName,now),
   db().prepare('INSERT OR IGNORE INTO enrollments (course_id,user_id,joined_at,source) VALUES (?,?,?,?)').bind(id,user.userId,now,isOwner?'author':'free'),
  ]);
  const results=await db().batch([
   db().prepare('SELECT lesson_id FROM progress WHERE user_id=?').bind(user.userId),
   db().prepare('SELECT lesson_id,body FROM notes WHERE user_id=?').bind(user.userId),
   db().prepare('SELECT lesson_id,score,passed,created_at FROM attempts WHERE user_id=? ORDER BY created_at DESC').bind(user.userId),
  ]);
  completed=(results[0].results as any[]).filter(r=>keys.has(r.lesson_id)).map(r=>keys.get(r.lesson_id)!);
  notes=Object.fromEntries((results[1].results as any[]).filter(r=>keys.has(r.lesson_id)).map(r=>[keys.get(r.lesson_id),r.body]));
  attempts=(results[2].results as any[]).filter(r=>keys.has(r.lesson_id)).slice(0,200).map(r=>({...r,lesson_id:keys.get(r.lesson_id)}));
  if(isOwner){
   const people=(await db().prepare('SELECT l.name,e.joined_at,l.user_id FROM enrollments e JOIN learners l ON l.user_id=e.user_id WHERE e.course_id=? ORDER BY e.joined_at DESC LIMIT 100').bind(id).all()).results as any[];
   const progresses=(await db().prepare('SELECT user_id,lesson_id FROM progress').all()).results as any[], scores=(await db().prepare('SELECT user_id,lesson_id,score FROM attempts').all()).results as any[];
   learners=people.map(l=>{const s=scores.filter(a=>a.user_id===l.user_id&&keys.has(a.lesson_id));return {...l,completed:progresses.filter(p=>p.user_id===l.user_id&&keys.has(p.lesson_id)).length,best_score:s.length?Math.max(...s.map(a=>a.score)):null};});
  }
 }
 if(!isOwner)for(const l of ls)l.questions=l.questions.map(({correct,explanation,...rest})=>rest as any);
 return json({course,courseId:id,revision:row?.revision??1,user:user?{name:user.displayName,email:user.email}:null,isOwner,completed,notes,attempts,learners});
 }catch(e){return fail(e);}}
