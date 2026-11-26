import type { SelfCheck,SelfCheckQuestion,SelfCheckAnswer } from './course';
export const SELF_CHECK_TEXT_LIMIT=8000;
export function isSelfCheckAnswered(q:SelfCheckQuestion,answer:unknown):answer is SelfCheckAnswer {
 if(q.kind==='open')return typeof answer==='string'&&!!answer.trim()&&answer.length<=SELF_CHECK_TEXT_LIMIT;
 const validIndex=(v:unknown)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<q.options.length;
 if(q.kind==='order'||q.kind==='matching'||q.kind==='multiple'){
  const count=q.kind==='matching'?q.roles.length:q.kind==='multiple'?q.selectionCount:q.options.length;
  return Array.isArray(answer)&&answer.length===count&&answer.every(validIndex)&&new Set(answer).size===count;
 }
 return validIndex(answer);
}
export function canOpenSelfCheckStage(exercise:SelfCheck,answers:Record<string,SelfCheckAnswer>,index:number){
 if(!Number.isInteger(index)||index<0||index>=exercise.stages.length)return false;
 return exercise.stages.slice(0,index).every(s=>s.questions.every(q=>isSelfCheckAnswered(q,answers[q.id])));
}
