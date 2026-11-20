import { allLessons } from '../../course';
import { db,json,fail,identity,sameOrigin,courseRecord,parseCourse } from '../../server';
export async function PUT(req:Request) { try {
 sameOrigin(req); const user=await identity(); const {lessonId,body}=await req.json() as any;
 if(typeof body!=='string'||body.length>20000) return json({error:'Заметка может содержать до 20 000 символов.'},400);
 if(!allLessons(parseCourse(await courseRecord())).some(l=>l.id===lessonId)) return json({error:'Урок не найден.'},404);
 await db().prepare('INSERT INTO notes (user_id,lesson_id,body,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at').bind(user.userId,lessonId,body,new Date().toISOString()).run();
 return json({ok:true});
 }catch(e){return fail(e);} }
