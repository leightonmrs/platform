import { getChatGPTUser } from '../../chatgpt-auth';
import { allLessons, initialCourse } from '../../course';
import { db, json, courseRecord, parseCourse, fail } from '../../server';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await getChatGPTUser();
    let row = await courseRecord();
    if (user && !row) {
      await db().prepare('INSERT OR IGNORE INTO courses (id, owner_id, data, revision, updated_at) VALUES (?, ?, ?, ?, ?)').bind('main',user.userId,JSON.stringify(initialCourse),1,new Date().toISOString()).run();
      row = await courseRecord();
    }
    const course = parseCourse(row);
    const isOwner = !!user && row?.owner_id === user.userId;
    let completed: string[] = [], notes: Record<string,string> = {}, attempts: any[] = [], learners: any[] = [];
    if (user) {
      await db().prepare('INSERT INTO learners (user_id,name,joined_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name').bind(user.userId,user.displayName,new Date().toISOString()).run();
      const results = await db().batch([
        db().prepare('SELECT lesson_id FROM progress WHERE user_id=?').bind(user.userId),
        db().prepare('SELECT lesson_id,body FROM notes WHERE user_id=?').bind(user.userId),
        db().prepare('SELECT lesson_id,score,passed,created_at FROM attempts WHERE user_id=? ORDER BY created_at DESC LIMIT 200').bind(user.userId),
      ]);
      const ids = new Set(allLessons(course).map(l=>l.id));
      completed = (results[0].results as any[]).map(r=>r.lesson_id).filter(id=>ids.has(id));
      notes = Object.fromEntries((results[1].results as any[]).map(r=>[r.lesson_id,r.body]));
      attempts = results[2].results as any[];
      if (isOwner) learners = ((await db().prepare('SELECT l.name,l.joined_at,l.user_id,(SELECT GROUP_CONCAT(lesson_id) FROM progress p WHERE p.user_id=l.user_id) AS completed_ids,(SELECT MAX(score) FROM attempts a WHERE a.user_id=l.user_id) AS best_score FROM learners l ORDER BY joined_at DESC LIMIT 100').all()).results as any[]).map(l=>({...l,completed:(l.completed_ids?.split(',')??[]).filter((id:string)=>ids.has(id)).length}));
    }
    if (!isOwner) for (const l of allLessons(course)) l.questions = l.questions.map(({correct,explanation,...rest})=>rest as any);
    return json({ course, revision: row?.revision??1, user: user ? { name:user.displayName,email:user.email } : null, isOwner, completed, notes, attempts, learners });
  } catch(e) { return fail(e); }
}
