import { allLessons } from '../../course';
import { db,json,fail,identity,sameOrigin,courseRecord,parseCourse } from '../../server';
export async function POST(req: Request) { try {
 sameOrigin(req); const user = await identity(); const {lessonId,completed} = await req.json() as any;
 const lesson = allLessons(parseCourse(await courseRecord())).find(l=>l.id===lessonId);
 if(!lesson) return json({error:'Урок не найден.'},404);
 if(completed && lesson.type==='quiz') return json({error:'Для завершения теста нужно набрать проходной балл.'},400);
 if(completed) await db().prepare('INSERT OR IGNORE INTO progress (user_id,lesson_id,completed_at) VALUES (?,?,?)').bind(user.userId,lessonId,new Date().toISOString()).run();
 else await db().prepare('DELETE FROM progress WHERE user_id=? AND lesson_id=?').bind(user.userId,lessonId).run();
 return json({ok:true});
 }catch(e){return fail(e);} }
