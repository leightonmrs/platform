'use client';
import { useEffect,useRef,useState } from 'react';
import { FilePenLine,CheckCheck,BookOpen,RotateCcw,LoaderCircle,History,LogIn,AlertCircle,LockKeyhole } from 'lucide-react';
import type { CaseStudy as Exercise,CaseStage,CaseSolution } from './course';
import { canOpenCaseStage,CASE_ANSWER_LIMIT } from './case-study-service';

type Submission={id:string;createdAt:string;answers:Record<string,string>;review:{id:string;modelAnswer:string}[];solution:CaseSolution};
type HistoryItem={id:string;createdAt:string};
async function request(courseId:string,path:string,method='GET',body?:unknown) {
 const r=await fetch(`/api/case-study?courseId=${encodeURIComponent(courseId)}${path}`,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});
 const d=await r.json() as any;
 if(!r.ok) throw new Error(d.error??'Не удалось сохранить решение.');
 return d;
}
export default function CaseStudy({exercise,lessonId,courseId,signedIn,onReading}:{exercise:Exercise;lessonId:string;courseId:string;signedIn:boolean;onReading:()=>void}) {
 const [stageIndex,setStageIndex]=useState(0),[answers,setAnswers]=useState<Record<string,string>>({});
 const [result,setResult]=useState<Submission|null>(null),[history,setHistory]=useState<HistoryItem[]>([]);
 const [version,setVersion]=useState(''),[loading,setLoading]=useState(signedIn),[loadFailed,setLoadFailed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const top=useRef<HTMLDivElement>(null),questions=exercise.stages.flatMap(s=>s.questions),stage=exercise.stages[stageIndex];
 const questionsDone=(s:CaseStage)=>s.questions.every(q=>!!answers[q.id]?.trim());
 const answered=questions.filter(q=>!!answers[q.id]?.trim()).length;
 async function load(submissionId?:string) {
  setLoading(true);setError('');setLoadFailed(false);
  try {
   const d=await request(courseId,`&lessonId=${encodeURIComponent(lessonId)}${submissionId?'&submissionId='+encodeURIComponent(submissionId):''}`);
   setVersion(d.version);setHistory(d.history);setResult(d.latest);
   if(d.latest) setAnswers(d.latest.answers);
  }catch(e){setError((e as Error).message);setLoadFailed(true);}finally{setLoading(false);}
 }
 useEffect(()=>{if(signedIn)load();},[courseId,lessonId,exercise.id,signedIn]);
 function move(index:number) {
  if(!canOpenCaseStage(exercise,answers,index)) return;
  setStageIndex(index);setError('');top.current?.scrollIntoView({behavior:'smooth',block:'start'});
 }
 async function submit() {
  if(answered!==questions.length){setError('Напишите ответ на каждый вопрос.');return;}
  setBusy(true);setError('');
  try {
   const d:Submission=await request(courseId,'','POST',{lessonId,version,answers});
   setResult(d);setAnswers(d.answers);setHistory(h=>[{id:d.id,createdAt:d.createdAt},...h].slice(0,100));
   top.current?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 function retry(){setAnswers({});setResult(null);setStageIndex(0);setError('');top.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 return <div className="case-study" ref={top}>
  <div className="case-heading"><span><FilePenLine size={25}/></span><div><h2>{exercise.title}</h2><p>{exercise.subtitle}</p></div></div>
  <p className="case-introduction">{exercise.introduction}</p>
  {error&&<div className="self-check-error" role="alert"><AlertCircle size={18}/><span>{error}</span></div>}
  {loading?<div className="self-check-loading" role="status"><LoaderCircle size={24} className="spin"/>Загружаем ваше решение…</div>:loadFailed?<button className="button button-secondary" onClick={()=>load()}>Повторить загрузку решения</button>:result?<>
   <section className="case-saved" aria-live="polite"><CheckCheck size={24}/><div><h3>Решение отправлено и сохранено</h3><p>Разбор открыт. Сравните свои ответы с ответами из учебного материала.</p><time dateTime={result.createdAt}>{new Date(result.createdAt).toLocaleString('ru-RU')}</time></div></section>
   <h3 className="case-review-title">Разбор после выполнения</h3><p className="case-introduction">{result.solution.introduction}</p>
   {exercise.stages.map(s=><section key={s.id}><StageContext stage={s}/>{s.questions.map(q=><article key={q.id} className="case-review"><h4>{q.number}. {q.prompt}</h4><div className="case-your-answer"><strong>Ваш ответ</strong><p>{result.answers[q.id]}</p></div><div className="case-model-answer"><strong>Разбор и ответ</strong><p>{result.review.find(r=>r.id===q.id)?.modelAnswer}</p></div></article>)}</section>)}
   <section className="case-solution"><h3>Пример строки в бланке</h3><blockquote>«{result.solution.report}»</blockquote><h3>Ответ врачу</h3><blockquote>«{result.solution.physician}»</blockquote><h3>Проверьте свой ответ</h3><p>{result.solution.checklist}</p></section>
   <p className="case-help">Сравните формулировки самостоятельно. Решение сохранено без автоматической оценки.</p>
   <div className="case-actions"><button className="button button-primary" onClick={retry}><RotateCcw size={17}/>Решить ещё раз</button><button className="button button-secondary" onClick={onReading}><BookOpen size={17}/>К материалу урока</button></div>
  </>:<>
   <p className="case-instructions">Напишите ответы своими словами. После ответов на первую часть откройте новые данные, затем отправьте решение целиком.</p>
   <nav className="case-steps" aria-label="Части ситуационной задачи">{exercise.stages.map((s,i)=><button key={s.id} type="button" className={i===stageIndex?'active':''} disabled={busy||!canOpenCaseStage(exercise,answers,i)} aria-current={i===stageIndex?'step':undefined} onClick={()=>move(i)}>{!canOpenCaseStage(exercise,answers,i)&&<LockKeyhole size={16}/>}<span>{s.title}</span></button>)}</nav>
   <p className="case-counter">Ответов заполнено: {answered} из {questions.length}</p>
   <form onSubmit={e=>{e.preventDefault();if(stageIndex<exercise.stages.length-1)move(stageIndex+1);else if(signedIn&&!busy)submit();}}>
    <StageContext stage={stage}/>
    {stage.questions.map(q=><div className="case-question" key={q.id}><label htmlFor={`case-${q.id}`}><span>{q.number}.</span> {q.prompt}</label><textarea id={`case-${q.id}`} name={q.id} required rows={6} maxLength={CASE_ANSWER_LIMIT} disabled={busy} value={answers[q.id]??''} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder="Напишите свой ответ…" aria-describedby={`case-count-${q.id}`}/><span className="case-answer-count" id={`case-count-${q.id}`}>{(answers[q.id]??'').length} / {CASE_ANSWER_LIMIT} символов</span></div>)}
    <div className="case-navigation"><button type="button" className="button button-secondary" disabled={stageIndex===0||busy} onClick={()=>move(stageIndex-1)}>К первой части</button>{stageIndex<exercise.stages.length-1?<button type="submit" className="button button-primary" disabled={!questionsDone(stage)||busy}>Открыть данные после сверки</button>:signedIn?<button type="submit" className="button button-primary" disabled={answered!==questions.length||busy||!version}>{busy?<LoaderCircle className="spin" size={17}/>:<CheckCheck size={17}/>}Отправить и открыть разбор</button>:<a className="button button-primary" href={'/signin-with-chatgpt?return_to='+encodeURIComponent(`/?course=${courseId}#lesson/${lessonId}`)} target="_top"><LogIn size={17}/>Войти для отправки</a>}</div>
   </form>
   <p className="case-help">Разбор с ответами откроется после отправки решения. До отправки можно вернуться к первой части и дополнить ответы.</p>
   <button className="text-button" onClick={onReading}><BookOpen size={17}/>Открыть материал урока</button>
  </>}
  {history.length>0&&<section className="case-history"><h3><History size={19}/>Мои решения</h3><ul>{history.map((h,i)=><li key={h.id}><div><strong>Решение {history.length-i}</strong><time dateTime={h.createdAt}>{new Date(h.createdAt).toLocaleString('ru-RU')}</time></div><button type="button" className="button button-secondary" disabled={loading||busy||result?.id===h.id} onClick={()=>load(h.id)}>{result?.id===h.id?'Открыто':'Посмотреть'}</button></li>)}</ul></section>}
 </div>;
}
function StageContext({stage}:{stage:CaseStage}) {
 return <div className="case-context"><h3>{stage.title}</h3><p>{stage.body}</p>{stage.table&&<div className="table-wrap"><table><caption>Записи рабочего листа и файла прибора</caption><thead><tr>{stage.table.headers.map((h,i)=><th scope="col" key={i}>{h}</th>)}</tr></thead><tbody>{stage.table.rows.map((r,i)=><tr key={i}>{r.map((cell,j)=>j===0?<th scope="row" key={j}>{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}{stage.rule&&<p className="case-rule">{stage.rule}</p>}</div>;
}
