import { courseSchema } from '../../validation';
import { allLessons, type Course } from '../../course';
import { db,json,fail,requireOwner,sameOrigin } from '../../server';
export async function PUT(req: Request) {
 try {
  sameOrigin(req); const {row} = await requireOwner();
  if (Number(req.headers.get('content-length'))>2000000) return json({error:'Курс слишком большой.'},413);
  const body = await req.json() as any;
  const parsed = courseSchema.safeParse(body.course);
  if (!parsed.success) return json({error:'Проверьте заполнение полей курса, ссылки и варианты ответов.',details:parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).slice(0,3)},400);
  const course = parsed.data as Course;
  const ids = [ ...course.modules.map(m=>m.id), ...allLessons(course).map(l=>l.id) ];
  if (new Set(ids).size!==ids.length) return json({error:'Идентификаторы модулей и уроков должны быть уникальны.'},400);
  if (body.revision!==row.revision) return json({error:'Курс изменён в другой вкладке. Обновите страницу перед сохранением.'},409);
  const old: Course = JSON.parse(row.data);
  const changed = allLessons(old).filter(l=>l.type==='quiz' && (JSON.stringify(l.questions)!==JSON.stringify(allLessons(course).find(n=>n.id===l.id)?.questions) || old.passScore!==course.passScore));
  const result = await db().prepare('UPDATE courses SET data=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(course),new Date().toISOString(),'main',row.revision).run();
  if (!result.meta.changes) return json({error:'Версия курса изменилась. Обновите страницу.'},409);
  if(changed.length) await db().batch(changed.flatMap(l=>[db().prepare('DELETE FROM progress WHERE lesson_id=?').bind(l.id),db().prepare('DELETE FROM attempts WHERE lesson_id=?').bind(l.id)]));
  return json({revision:row.revision+1,resetQuizResults:changed.length>0});
 } catch(e) { return fail(e); }
}
