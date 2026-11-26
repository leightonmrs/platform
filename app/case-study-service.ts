import type { CaseStudy } from './course';
export const CASE_ANSWER_LIMIT = 8000;
export function validateCaseAnswers(exercise: CaseStudy, answers: unknown): Record<string,string> {
 if(!answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('INCOMPLETE_CASE');
 const input = answers as Record<string,unknown>;
 return Object.fromEntries(exercise.stages.flatMap(s=>s.questions).map(q=>{
  const answer = input[q.id];
  if(typeof answer !== 'string' || !answer.trim()) throw new Error('INCOMPLETE_CASE');
  if(answer.length > CASE_ANSWER_LIMIT) throw new Error('LONG_CASE_ANSWER');
  return [q.id,answer.trim()];
 }));
}
export function canOpenCaseStage(exercise: CaseStudy, answers: Record<string,string>, index: number) {
 return Number.isInteger(index) && index >= 0 && index < exercise.stages.length && exercise.stages.slice(0,index).every(s=>s.questions.every(q=>typeof answers[q.id]==='string' && !!answers[q.id].trim()));
}
