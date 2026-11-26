import type { SelfCheck,SelfCheckAnswer } from './course';
import { isSelfCheckAnswered } from './self-check-flow';
export { contentVersion as selfCheckVersion } from './content-version';
export function gradeSelfCheck(exercise:SelfCheck,answers:unknown){
 const questions=exercise.stages.flatMap(s=>s.questions);
 if(!answers||typeof answers!=='object'||Array.isArray(answers))throw new Error('INCOMPLETE');
 const input=answers as Record<string,unknown>;
 if(questions.some(q=>!isSelfCheckAnswered(q,input[q.id])))throw new Error('INCOMPLETE');
 const clean:Record<string,SelfCheckAnswer>=Object.fromEntries(questions.map(q=>[q.id,typeof input[q.id]==='string'?(input[q.id] as string).trim():input[q.id] as SelfCheckAnswer]));
 const review=questions.map(q=>{
  const selected=clean[q.id];
  if(q.kind==='open')return {id:q.id,number:q.number,selected,isCorrect:null,explanation:q.explanation,rubric:q.rubric};
  const isCorrect=Array.isArray(q.correct)
   ?Array.isArray(selected)&&q.correct.every((n,i)=>q.kind==='multiple'?selected.includes(n):selected[i]===n)
   :selected===q.correct;
  return {id:q.id,number:q.number,selected,correct:q.correct,isCorrect,explanation:q.explanation};
 });
 const correct=review.filter(q=>q.isCorrect===true).length,total=questions.filter(q=>q.kind!=='open').length;
 return {answers:clean,review,correct,total,score:total?Math.round(correct/total*100):0};
}
