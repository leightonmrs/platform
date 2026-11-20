import { env } from 'cloudflare:workers';
import { getChatGPTUser } from './chatgpt-auth';
import { initialCourse, type Course } from './course';
export function db() { if (!env.DB) throw new Error('Хранилище временно недоступно'); return env.DB; }
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
export async function identity() { const u = await getChatGPTUser(); if (!u) throw new Error('AUTH'); return u; }
export function sameOrigin(req: Request) { const origin = req.headers.get('origin'); if (origin && origin !== new URL(req.url).origin) throw new Error('ORIGIN'); }
export async function courseRecord() { return await db().prepare('SELECT * FROM courses WHERE id = ?').bind('main').first<{ id: string; owner_id: string; data: string; revision: number }>(); }
export async function requireOwner() { const user = await identity(); const row = await courseRecord(); if (!row || row.owner_id !== user.userId) throw new Error('FORBIDDEN'); return { user, row }; }
export function fail(e: unknown) { const m = e instanceof Error ? e.message : ''; if (m === 'AUTH') return json({error:'Войдите, чтобы сохранить результат.'},401); if (m === 'FORBIDDEN' || m === 'ORIGIN') return json({error:'Недостаточно прав для этого действия.'},403); console.error('Academy API:', m); return json({error:'Не удалось выполнить действие. Попробуйте ещё раз.'},500); }
export function parseCourse(row: { data: string } | null): Course { return row ? JSON.parse(row.data) : structuredClone(initialCourse); }
export function idValid(id: unknown) { return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id); }
