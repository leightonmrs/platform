import { commerce } from '../../course';
import { db,json,fail,identity,sameOrigin,courseRecord,parseCourse,idValid,hasAccess } from '../../server';
export async function POST(req:Request){try{
 sameOrigin(req);const u=await identity(),{courseId}=await req.json() as any;if(!idValid(courseId))return json({error:'Курс не найден.'},404);
 const row=await courseRecord(courseId);if(!row)throw new Error('NOT_FOUND');const m=commerce(parseCourse(row));
 if(!m.published&&row.owner_id!==u.userId)throw new Error('NOT_FOUND');
 if(!await hasAccess(row,u))throw new Error('PAYMENT_REQUIRED');
 await db().prepare('INSERT OR IGNORE INTO enrollments (course_id,user_id,joined_at,source) VALUES (?,?,?,?)').bind(courseId,u.userId,new Date().toISOString(),'free').run();return json({ok:true});
 }catch(e){return fail(e);}}
