import { allLessons } from '../../course';
import { db,json,fail,identity,sameOrigin,accessibleCourse,idValid } from '../../server';
import { validateCaseAnswers } from '../../case-study-service';
import { contentVersion } from '../../content-version';

async function context(req:Request, lessonId:unknown) {
 const user=await identity();
 const {id:courseId,course}=await accessibleCourse(req,user);
 if(!idValid(lessonId)) throw new Error('NOT_FOUND');
 const exercise=allLessons(course).find(l=>l.id===lessonId)?.caseStudy;
 if(!exercise) throw new Error('NOT_FOUND');
 return {user,courseId,lessonId:lessonId as string,exercise,version:await contentVersion(exercise)};
}
type Context = Awaited<ReturnType<typeof context>>;
function result(c:Context,row:any) {
 return {id:row.id,createdAt:row.created_at,answers:JSON.parse(row.answers),
  review:c.exercise.stages.flatMap(s=>s.questions).map(q=>({id:q.id,modelAnswer:q.modelAnswer})),solution:c.exercise.solution};
}
function handle(e:unknown) {
 if(e instanceof Error) {
  if(e.message==='INCOMPLETE_CASE') return json({error:'Напишите ответ на каждый вопрос, прежде чем отправить решение.'},400);
  if(e.message==='LONG_CASE_ANSWER') return json({error:'Ответ на один вопрос должен содержать не более 8000 символов.'},400);
  if(e instanceof SyntaxError) return json({error:'Не удалось прочитать запрос.'},400);
 }
 return fail(e);
}
export async function GET(req:Request) {try {
 const params=new URL(req.url).searchParams,c=await context(req,params.get('lessonId'));
 const history=(await db().prepare('SELECT id,created_at FROM case_submissions WHERE user_id=? AND course_id=? AND lesson_id=? AND case_id=? AND version=? ORDER BY created_at DESC,id DESC LIMIT 100')
  .bind(c.user.userId,c.courseId,c.lessonId,c.exercise.id,c.version).all()).results as {id:string;created_at:string}[];
 const selected=params.get('submissionId')??history[0]?.id;
 if(selected && !idValid(selected)) throw new Error('NOT_FOUND');
 const row=selected?await db().prepare('SELECT id,created_at,answers FROM case_submissions WHERE id=? AND user_id=? AND course_id=? AND lesson_id=? AND case_id=? AND version=?')
  .bind(selected,c.user.userId,c.courseId,c.lessonId,c.exercise.id,c.version).first():null;
 if(params.has('submissionId') && !row) throw new Error('NOT_FOUND');
 return json({version:c.version,latest:row?result(c,row):null,history:history.map(r=>({id:r.id,createdAt:r.created_at}))});
 }catch(e){return handle(e);}}
export async function POST(req:Request) {try {
 sameOrigin(req);
 const raw=await req.text();
 if(new TextEncoder().encode(raw).byteLength>150000) return json({error:'Слишком большой запрос.'},413);
 const input=JSON.parse(raw);
 const c=await context(req,input?.lessonId);
 if(input?.version!==c.version) return json({error:'Условия задачи обновились. Скопируйте свои ответы и обновите страницу перед отправкой.'},409);
 const answers=validateCaseAnswers(c.exercise,input?.answers),id=crypto.randomUUID(),createdAt=new Date().toISOString();
 await db().prepare('INSERT INTO case_submissions (id,user_id,course_id,lesson_id,case_id,version,answers,created_at) VALUES (?,?,?,?,?,?,?,?)')
  .bind(id,c.user.userId,c.courseId,c.lessonId,c.exercise.id,c.version,JSON.stringify(answers),createdAt).run();
 return json(result(c,{id,created_at:createdAt,answers:JSON.stringify(answers)}),201);
 }catch(e){return handle(e);}}
