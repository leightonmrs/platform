import { allLessons, lessonKey } from '../../course';
import { db,json,fail,identity,sameOrigin,accessibleCourse } from '../../server';
export async function POST(req:Request) { try {
 sameOrigin(req); const user=await identity(); const {lessonId,answers}=await req.json() as any;
 const {id,course}=await accessibleCourse(req,user);const key=lessonKey(id,lessonId); const lesson=allLessons(course).find(l=>l.id===lessonId&&l.type==='quiz');
 if(!lesson||!lesson.questions.length) return json({error:'Тест не найден.'},404);
 if(!answers||lesson.questions.some(q=>!Number.isInteger(answers[q.id])||answers[q.id]<0||answers[q.id]>=q.options.length)) return json({error:'Ответьте на все вопросы.'},400);
 const review=lesson.questions.map(q=>({id:q.id,correct:q.correct,explanation:q.explanation,isCorrect:answers[q.id]===q.correct}));
 const score=Math.round(100*review.filter(r=>r.isCorrect).length/review.length),passed=score>=course.passScore,now=new Date().toISOString();
 const statements=[db().prepare('INSERT INTO attempts (id,user_id,lesson_id,score,passed,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),user.userId,key,score,passed?1:0,now)];
 if(passed) statements.push(db().prepare('INSERT OR IGNORE INTO progress (user_id,lesson_id,completed_at) VALUES (?,?,?)').bind(user.userId,key,now));
 await db().batch(statements);
 return json({score,passed,review,createdAt:now});
 }catch(e){return fail(e);} }
