import { commerce } from '../../course';
import { db,json,fail,identity,sameOrigin,courseRecord,parseCourse,idValid,requirePlatformOwner } from '../../server';
export async function GET(){try{
 const u=await identity(),main=await courseRecord(),owner=main?.owner_id===u.userId;
 const rows=(await db().prepare(owner?'SELECT o.*,c.data AS course_data FROM orders o JOIN courses c ON c.id=o.course_id ORDER BY o.created_at DESC LIMIT 200':'SELECT o.*,c.data AS course_data FROM orders o JOIN courses c ON c.id=o.course_id WHERE o.user_id=? ORDER BY o.created_at DESC LIMIT 100').bind(...(owner?[]:[u.userId])).all()).results as any[];
 return json({items:rows.map(({course_data,...o})=>({...o,courseTitle:JSON.parse(course_data).title,paymentUrl:o.status==='pending'?commerce(parseCourse({data:course_data})).paymentUrl:''})),isOwner:owner});
 }catch(e){return fail(e);}}
export async function POST(req:Request){try{
 sameOrigin(req);const u=await identity(),{courseId}=await req.json() as any;
 if(!idValid(courseId))throw new Error('NOT_FOUND');const row=await courseRecord(courseId);if(!row)throw new Error('NOT_FOUND');const m=commerce(parseCourse(row));
 if(!m.published)throw new Error('NOT_FOUND');if(m.priceKzt===0)return json({error:'На бесплатный курс можно записаться без оплаты.'},400);
 if(!m.paymentUrl)return json({error:'Оплата этого курса пока не настроена.'},409);
 if(await db().prepare('SELECT 1 FROM enrollments WHERE course_id=? AND user_id=?').bind(courseId,u.userId).first())return json({error:'Этот курс уже доступен в вашем кабинете.'},409);
 const existing=await db().prepare('SELECT id,amount_kzt,status FROM orders WHERE course_id=? AND user_id=? AND status=? ORDER BY created_at DESC LIMIT 1').bind(courseId,u.userId,'pending').first<any>();
 if(existing)return json({...existing,paymentUrl:m.paymentUrl});
 const id=crypto.randomUUID();await db().prepare('INSERT INTO orders (id,course_id,user_id,name,amount_kzt,status,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,courseId,u.userId,u.displayName,m.priceKzt,'pending',new Date().toISOString()).run();
 return json({id,amount_kzt:m.priceKzt,status:'pending',paymentUrl:m.paymentUrl},201);
 }catch(e){return fail(e);}}
export async function PATCH(req:Request){try{
 sameOrigin(req);await requirePlatformOwner();const {orderId,action}=await req.json() as any;
 if(!idValid(orderId)||!['paid','cancelled'].includes(action))return json({error:'Некорректное действие.'},400);
 const order=await db().prepare('SELECT * FROM orders WHERE id=?').bind(orderId).first<any>();if(!order)return json({error:'Заказ не найден.'},404);
 if(order.status===action)return json({ok:true});if(order.status!=='pending')return json({error:'Заказ уже обработан.'},409);
 const now=new Date().toISOString();const statements=[db().prepare('UPDATE orders SET status=?,paid_at=? WHERE id=? AND status=?').bind(action,action==='paid'?now:null,orderId,'pending')];
 if(action==='paid')statements.push(db().prepare('INSERT OR IGNORE INTO enrollments (course_id,user_id,joined_at,source) SELECT course_id,user_id,?,? FROM orders WHERE id=? AND status=?').bind(now,'payment',orderId,'paid'));
 await db().batch(statements);return json({ok:true});
 }catch(e){return fail(e);}}
