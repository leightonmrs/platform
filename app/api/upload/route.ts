import { env } from 'cloudflare:workers';
import { db,json,fail,requireOwner,sameOrigin } from '../../server';
export async function POST(req:Request) {try{
 sameOrigin(req); await requireOwner();
 const limit=50*1024*1024;
 if(Number(req.headers.get('content-length'))>limit+50000) return json({error:'Максимальный размер файла — 50 МБ.'},413);
 const form=await req.formData(); const file=form.get('file');
 if(!(file instanceof File)||!file.size) return json({error:'Выберите непустой файл.'},400);
 if(file.size>limit) return json({error:'Максимальный размер файла — 50 МБ.'},413);
 const types:Record<string,string>={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',mp4:'video/mp4',webm:'video/webm',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',txt:'text/plain'};
 const ext=file.name.split('.').pop()?.toLowerCase()??''; const type=types[ext];
 if(!type) return json({error:'Поддерживаются PDF, DOCX, PPTX, XLSX, MP4, WebM, PNG, JPG и TXT.'},400);
 if(!env.BUCKET) throw new Error('Хранилище файлов недоступно');
 const id=crypto.randomUUID(),name=file.name.slice(0,250);
 await env.BUCKET.put(id,file.stream(),{httpMetadata:{contentType:type}});
 try{await db().prepare('INSERT INTO assets (id,name,content_type,size,created_at) VALUES (?,?,?,?,?)').bind(id,name,type,file.size,new Date().toISOString()).run();}catch(e){await env.BUCKET.delete(id);throw e;}
 return json({id,name,url:`/api/files/${id}`,size:file.size,type});
 }catch(e){return fail(e);} }
