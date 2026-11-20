import { env } from 'cloudflare:workers';
import { db,json,fail,identity,idValid } from '../../../server';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}) {try{
 await identity(); const {id}=await params;
 if(!idValid(id)) return json({error:'Файл не найден.'},404);
 const meta=await db().prepare('SELECT * FROM assets WHERE id=?').bind(id).first<any>();
 if(!meta||!env.BUCKET) return json({error:'Файл не найден.'},404);
 const file=await env.BUCKET.get(id,{range:req.headers});
 if(!file) return json({error:'Файл не найден.'},404);
 const headers=new Headers({'Content-Type':meta.content_type,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Accept-Ranges':'bytes','Content-Disposition':`${meta.content_type.startsWith('video/')||meta.content_type==='application/pdf'?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(meta.name)}`});
 let status=200; const range=file.range;
 if(req.headers.has('range')&&range&&'offset' in range&&range.offset!==undefined&&'length' in range&&range.length!==undefined){status=206;headers.set('Content-Range',`bytes ${range.offset}-${range.offset+range.length-1}/${file.size}`);headers.set('Content-Length',String(range.length));}
 else headers.set('Content-Length',String(file.size));
 return new Response(file.body,{status,headers});
 }catch(e){return fail(e);} }
