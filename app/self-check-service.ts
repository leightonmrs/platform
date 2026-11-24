import { type SelfCheck } from './course';
function stable(value:any):string {
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
 return JSON.stringify(value);
}
export async function selfCheckVersion(exercise:SelfCheck){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(exercise)));
 return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function gradeSelfCheck(exercise:SelfCheck,answers:Record<string,number>){
 const questions=exercise.stages.flatMap(s=>s.questions);
 if(!answers||Array.isArray(answers)||questions.some(q=>!Number.isInteger(answers[q.id])||answers[q.id]<0||answers[q.id]>=q.options.length))throw new Error('INCOMPLETE');
 const clean=Object.fromEntries(questions.map(q=>[q.id,answers[q.id]]));
 const review=questions.map(q=>({id:q.id,number:q.number,selected:clean[q.id],correct:q.correct,isCorrect:clean[q.id]===q.correct,explanation:q.explanation}));
 const correct=review.filter(q=>q.isCorrect).length,total=questions.length;
 return {answers:clean,review,correct,total,score:Math.round(correct/total*100)};
}
