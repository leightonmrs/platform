import type { SelfCheck } from './course';
export function canOpenSelfCheckStage(exercise:SelfCheck,answers:Record<string,number>,index:number){
 if(!Number.isInteger(index)||index<0||index>=exercise.stages.length)return false;
 return exercise.stages.slice(0,index).every(s=>s.questions.every(q=>Number.isInteger(answers[q.id])&&answers[q.id]>=0&&answers[q.id]<q.options.length));
}
