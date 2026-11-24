'use client';
import { useEffect,useRef,useState } from 'react';
import { Check,CheckCheck,BookOpen,RotateCcw,LoaderCircle,ListChecks,Clock3,History,LogIn,AlertCircle } from 'lucide-react';
import { canOpenSelfCheckStage } from './self-check-flow';
import type { SelfCheck as Exercise,SelfCheckQuestion,SelfCheckStage } from './course';
type Feedback={id:string;number:number;selected:number;correct:number;isCorrect:boolean;explanation:string};
type Result={id:string;createdAt:string;answers:Record<string,number>;review:Feedback[];correct:number;total:number;score:number};
type Attempt={id:string;createdAt:string;correct:number;total:number;score:number};
const letters=['А','Б','В','Г','Д','Е','Ж','З'];
async function request(courseId:string,path:string,method='GET',body?:unknown){const r=await fetch(`/api/self-check?courseId=${encodeURIComponent(courseId)}${path}`,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const d=await r.json() as any;if(!r.ok)throw new Error(d.error??'Не удалось сохранить попытку.');return d;}
export default function SelfCheck({exercise,lessonId,courseId,signedIn,onReading}:{exercise:Exercise;lessonId:string;courseId:string;signedIn:boolean;onReading:()=>void}){
 const [stageIndex,setStageIndex]=useState(0),[answers,setAnswers]=useState<Record<string,number>>({}),[result,setResult]=useState<Result|null>(null),[history,setHistory]=useState<Attempt[]>([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(signedIn),[error,setError]=useState('');
 const top=useRef<HTMLDivElement>(null),questions=exercise.stages.flatMap(s=>s.questions),stage=exercise.stages[stageIndex];
 async function load(){setLoading(true);try{setError('');const d=await request(courseId,`&lessonId=${encodeURIComponent(lessonId)}`);setHistory(d.history);setResult(d.latest);if(d.latest)setAnswers(d.latest.answers);}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
 useEffect(()=>{if(signedIn)load();},[courseId,lessonId,exercise.id,signedIn]);
 const stageDone=(s:SelfCheckStage)=>s.questions.every(q=>Number.isInteger(answers[q.id]));
 const unlocked=(index:number)=>canOpenSelfCheckStage(exercise,answers,index);
 const answered=questions.filter(q=>Number.isInteger(answers[q.id])).length,best=history.length?Math.max(...history.map(a=>a.correct)):null;
 function move(index:number){if(!unlocked(index))return;setStageIndex(index);setError('');top.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 async function submit(){if(questions.some(q=>answers[q.id]===undefined)){setError('Ответьте на все вопросы, прежде чем завершить попытку.');return;}setBusy(true);setError('');try{const d:Result=await request(courseId,'','POST',{lessonId,answers});setResult(d);setHistory(h=>[{id:d.id,createdAt:d.createdAt,correct:d.correct,total:d.total,score:d.score},...h].slice(0,100));top.current?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function retry(){setAnswers({});setResult(null);setStageIndex(0);setError('');top.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 return <div className="self-check" ref={top}>
  <div className="self-check-heading"><span className="self-check-icon"><ListChecks size={25}/></span><div><h2>{exercise.title}</h2><p>{exercise.subtitle}</p></div></div>
  <p className="self-check-instructions">{exercise.instructions}</p>
  <div className="self-check-meta"><span><Clock3 size={16}/>Около 10 минут</span><span><CheckCheck size={17}/>По 1 баллу за верный ответ</span>{best!==null&&<strong>Лучший результат: {best} из {questions.length}</strong>}</div>
  {error&&<div className="self-check-error" role="alert"><AlertCircle size={18}/><span>{error}</span></div>}
  {loading?<div className="self-check-loading"><LoaderCircle size={24} className="spin"/><span>Загружаем ваши результаты…</span><button className="text-button" onClick={load}>Повторить</button></div>:result?<>
   <section className="self-check-result" aria-live="polite"><span className="self-check-result-score">{result.correct}<small> / {result.total}</small></span><div><h3>Самопроверка завершена</h3><p>{result.correct===result.total?'Вы верно ответили на все вопросы.':`Посмотрите пояснения к ответам. Вы можете вернуться к конспекту и повторить попытку.`}</p><span>{new Date(result.createdAt).toLocaleString('ru-RU')}</span></div></section>
   <div className="self-check-result-actions"><button className="button button-primary" onClick={retry}><RotateCcw size={17}/>Пройти ещё раз</button><button className="button button-secondary" onClick={onReading}><BookOpen size={17}/>К материалу урока</button></div>
   <h3 className="self-check-review-title">Ответы и пояснения</h3>
   {exercise.stages.map(s=><section className="self-check-review-stage" key={s.id}><StageContext stage={s}/>{s.questions.map(q=><Question key={q.id} question={q} selected={result.answers[q.id]} feedback={result.review.find(r=>r.id===q.id)}/>)}</section>)}
   <p className="self-check-closing">{exercise.closing}</p>
  </>:<>
   <nav className="self-check-steps" aria-label="Этапы самопроверки">{exercise.stages.map((s,i)=><button key={s.id} className={stageIndex===i?'active':''} disabled={!unlocked(i)||busy} aria-current={stageIndex===i?'step':undefined} onClick={()=>move(i)}><span>{stageDone(s)?<Check size={15}/>:i+1}</span><strong>Вопрос{s.questions.length>1?'ы':''} {s.questions[0].number}{s.questions.length>1?`–${s.questions.at(-1)!.number}`:''}</strong></button>)}</nav>
   <div className="self-check-stage-label">Этап {stageIndex+1} из {exercise.stages.length} · Отвечено {answered} из {questions.length}</div>
   <StageContext stage={stage}/>
   {stage.questions.map(q=><Question key={q.id} question={q} selected={answers[q.id]} disabled={busy} onSelect={value=>setAnswers(a=>({...a,[q.id]:value}))}/>)}
   {stageIndex===exercise.stages.length-1&&<p className="self-check-closing">{exercise.closing}</p>}
   <div className="self-check-navigation"><button className="button button-secondary" disabled={stageIndex===0||busy} onClick={()=>move(stageIndex-1)}>Назад</button>{stageIndex<exercise.stages.length-1?<button className="button button-primary" disabled={!stageDone(stage)||busy} onClick={()=>move(stageIndex+1)}>{stageIndex===0?'Открыть данные контролей':'Открыть повторную серию'}</button>:signedIn?<button className="button button-primary" disabled={!stageDone(stage)||busy} onClick={submit}>{busy?<LoaderCircle className="spin" size={17}/>:<CheckCheck size={17}/>}Завершить и проверить</button>:<a className="button button-primary" href={'/signin-with-chatgpt?return_to='+encodeURIComponent(`/?course=${courseId}#lesson/${lessonId}`)} target="_top"><LogIn size={16}/>Войти и сохранить результат</a>}</div>
   <div className="self-check-help"><span>Ответы и комментарии появятся после завершения попытки.</span><button className="text-button" onClick={onReading}><BookOpen size={16}/>Открыть материал урока</button></div>
  </>}
  {history.length>0&&<section className="self-check-history"><h3><History size={19}/>Мои попытки</h3><div className="table-wrap"><table><thead><tr><th>Дата</th><th>Верных ответов</th><th>Результат</th></tr></thead><tbody>{history.map(a=><tr key={a.id}><td>{new Date(a.createdAt).toLocaleString('ru-RU')}</td><td>{a.correct} из {a.total}</td><td>{a.score}%</td></tr>)}</tbody></table></div></section>}
 </div>;
}
function StageContext({stage}:{stage:SelfCheckStage}){return <div className="self-check-context"><h3>{stage.title}</h3>{stage.body.split('\n\n').map((p,i)=><p key={i}>{p}</p>)}{stage.table&&<div className="table-wrap self-check-controls"><table><caption>Данные учебной серии</caption><thead><tr>{stage.table.headers.map((h,i)=><th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{stage.table.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th key={j} scope="row">{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}</div>;}
function Question({question:q,selected,onSelect,disabled,feedback}:{question:SelfCheckQuestion;selected?:number;onSelect?:(n:number)=>void;disabled?:boolean;feedback?:Feedback}){
 return <fieldset className={`self-check-question ${feedback?(feedback.isCorrect?'is-correct':'is-incorrect'):''}`} disabled={disabled||!!feedback}><legend><span>{q.number}.</span>{q.prompt}</legend>{q.image&&<figure className="self-check-figure"><img src={q.image.url} alt={q.image.alt} width={1450} height={574}/><figcaption>{q.image.caption}</figcaption></figure>}{q.options.map((option,i)=><label key={i} className={`${selected===i?'selected':''} ${feedback?.correct===i?'correct-answer':''}`}><input type="radio" name={`self-${q.id}`} checked={selected===i} onChange={()=>onSelect?.(i)}/><span className="self-check-letter">{letters[i]}.</span><span>{option}</span>{feedback?.correct===i&&<Check size={18}/>}</label>)}{feedback&&<div className="self-check-feedback"><strong>{feedback.isCorrect?'Верно · 1 балл':'0 баллов'}{!feedback.isCorrect&&` · Правильный ответ: ${letters[feedback.correct]}`}</strong><p>{feedback.explanation}</p></div>}</fieldset>;
}
