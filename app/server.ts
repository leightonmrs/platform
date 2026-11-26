import { attachDefaultSelfCheck } from './self-check-data';
import { attachDefaultCaseStudy } from './case-study-data';
import { env } from 'cloudflare:workers';
import { getChatGPTUser, type ChatGPTUser } from './chatgpt-auth';
import { initialCourse, commerce, PLATFORM_NAME, type Course } from './course';
export function db() { if (!env.DB) throw new Error('Хранилище временно недоступно'); return env.DB; }
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
export async function identity() { const u = await getChatGPTUser(); if (!u) throw new Error('AUTH'); return u; }
export function sameOrigin(req: Request) { const origin = req.headers.get('origin'); if (origin && origin !== new URL(req.url).origin) throw new Error('ORIGIN'); }
export type CourseRecord = { id: string; owner_id: string; data: string; revision: number };
export function requestedCourseId(req:Request) { const id=new URL(req.url).searchParams.get('courseId')??'main'; if(!idValid(id))throw new Error('NOT_FOUND');return id; }
export async function courseRecord(id='main') { return await db().prepare('SELECT * FROM courses WHERE id = ?').bind(id).first<CourseRecord>(); }
export async function ensureMain(user:ChatGPTUser|null) {
 let row=await courseRecord();
 if(user&&!row){await db().prepare('INSERT OR IGNORE INTO courses (id,owner_id,data,revision,updated_at) VALUES (?,?,?,?,?)').bind('main',user.userId,JSON.stringify(initialCourse),1,new Date().toISOString()).run();row=await courseRecord();}
 return row;
}
export async function requireOwner(id='main') { const user=await identity(); const row=await courseRecord(id); if(!row)throw new Error('NOT_FOUND');if(row.owner_id!==user.userId)throw new Error('FORBIDDEN');return {user,row}; }
export async function requirePlatformOwner(){return requireOwner('main');}
export async function hasAccess(row:CourseRecord,user:ChatGPTUser|null) {
 if(user?.userId===row.owner_id)return true;
 const meta=commerce(parseCourse(row));if(!meta.published)return false;
 if(meta.priceKzt===0)return true;
 if(!user)return false;
 return !!await db().prepare('SELECT 1 AS present FROM enrollments WHERE user_id=? AND course_id=?').bind(user.userId,row.id).first();
}
export async function accessibleCourse(req:Request,user:ChatGPTUser|null) {
 const id=requestedCourseId(req),row=await courseRecord(id);
 if(!row){if(id==='main'&&!user)return {id,row:null,course:parseCourse(null)};throw new Error('NOT_FOUND');}
 if(!await hasAccess(row,user))throw new Error(commerce(parseCourse(row)).published?'PAYMENT_REQUIRED':'NOT_FOUND');
 return {id,row,course:parseCourse(row)};
}
export function fail(e: unknown) { const m = e instanceof Error ? e.message : ''; if (m === 'AUTH') return json({error:'Войдите, чтобы сохранить результат.'},401); if(m==='NOT_FOUND')return json({error:'Курс не найден или ещё не опубликован.'},404);if(m==='PAYMENT_REQUIRED')return json({error:'Для доступа к этому курсу необходимо оформить покупку в каталоге.'},402);if (m === 'FORBIDDEN' || m === 'ORIGIN') return json({error:'Недостаточно прав для этого действия.'},403); console.error('Academy API:', m); return json({error:'Не удалось выполнить действие. Попробуйте ещё раз.'},500); }
export function parseCourse(row: { data: string; id?: string } | null): Course {const c:Course=row?JSON.parse(row.data):structuredClone(initialCourse);if(c.organization==='ПЦР Академия')c.organization=PLATFORM_NAME;const id=row?.id??(row===null?'main':'');return attachDefaultCaseStudy(attachDefaultSelfCheck(c,id),id);}
export function idValid(id: unknown) { return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id); }
