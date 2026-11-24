import { allLessons } from '../../course';
import { db,json,fail,identity,sameOrigin,accessibleCourse,idValid } from '../../server';
import { selfCheckVersion,gradeSelfCheck } from '../../self-check-service';
async function context(req:Request,lessonId:unknown){
 const user=await identity();const {id:courseId,course}=await accessibleCourse(req,user);
 if(!idValid(lessonId))throw new Error('NOT_FOUND');
 const exercise=allLessons(course).find(l=>l.id===lessonId)?.selfCheck;if(!exercise)throw new Error('NOT_FOUND');
 return {user,courseId,lessonId:lessonId as string,exercise,version:await selfCheckVersion(exercise)};
}
function handle(e:unknown){if(e instanceof Error&&e.message==='INCOMPLETE')return json({error:'Выберите один ответ в каждом вопросе.'},400);return fail(e);}
export async function GET(req:Request){try{
 const {user,courseId,lessonId,exercise,version}=await context(req,new URL(req.url).searchParams.get('lessonId'));
 const rows=(await db().prepare('SELECT * FROM self_check_attempts WHERE user_id=? AND course_id=? AND lesson_id=? AND exercise_id=? AND version=? ORDER BY created_at DESC,id DESC LIMIT 100').bind(user.userId,courseId,lessonId,exercise.id,version).all()).results as any[];
 const latest=rows[0]?{id:rows[0].id,createdAt:rows[0].created_at,...gradeSelfCheck(exercise,JSON.parse(rows[0].answers))}:null;
 return json({latest,history:rows.map(r=>({id:r.id,correct:r.correct_count,total:r.total_count,score:Math.round(r.correct_count/r.total_count*100),createdAt:r.created_at})),bestScore:rows.length?Math.max(...rows.map(r=>Math.round(r.correct_count/r.total_count*100))):null});
 }catch(e){return handle(e);}}
export async function POST(req:Request){try{
 sameOrigin(req);if(Number(req.headers.get('content-length'))>50000)return json({error:'Слишком большой запрос.'},413);
 const {lessonId,answers}=await req.json() as any;const c=await context(req,lessonId);const result=gradeSelfCheck(c.exercise,answers);
 const id=crypto.randomUUID(),createdAt=new Date().toISOString();
 await db().prepare('INSERT INTO self_check_attempts (id,user_id,course_id,lesson_id,exercise_id,version,answers,correct_count,total_count,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,c.user.userId,c.courseId,c.lessonId,c.exercise.id,c.version,JSON.stringify(result.answers),result.correct,result.total,createdAt).run();
 return json({id,createdAt,...result});
 }catch(e){return handle(e);}}
