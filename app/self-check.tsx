'use client';
import { useEffect,useRef,useState } from 'react';
import { Check,CheckCheck,BookOpen,RotateCcw,LoaderCircle,ListChecks,Clock3,History,LogIn,AlertCircle } from 'lucide-react';
import { canOpenSelfCheckStage,isSelfCheckAnswered,SELF_CHECK_TEXT_LIMIT } from './self-check-flow';
import type { SelfCheck as Exercise,SelfCheckQuestion,SelfCheckStage,SelfCheckAnswer } from './course';
type Feedback={id:string;number:number;selected:SelfCheckAnswer;correct?:number|number[];isCorrect:boolean|null;explanation:string;rubric?:string[]};
type Result={id:string;createdAt:string;answers:Record<string,SelfCheckAnswer>;review:Feedback[];correct:number;total:number;score:number};
type Attempt={id:string;createdAt:string;correct:number;total:number;score:number};
const letters=['А','Б','В','Г','Д','Е','Ж','З'];
async function request(courseId:string,path:string,method='GET',body?:unknown){const r=await fetch(`/api/self-check?courseId=${encodeURIComponent(courseId)}${path}`,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const d=await r.json() as any;if(!r.ok)throw new Error(d.error??'Не удалось сохранить попытку.');return d;}
export default function SelfCheck({exercise,lessonId,courseId,signedIn,onReading}:{exercise:Exercise;lessonId:string;courseId:string;signedIn:boolean;onReading:()=>void}){
 const [stageIndex,setStageIndex]=useState(0),[answers,setAnswers]=useState<Record<string,SelfCheckAnswer>>({}),[result,setResult]=useState<Result|null>(null),[history,setHistory]=useState<Attempt[]>([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(signedIn),[error,setError]=useState('');
 const top=useRef<HTMLDivElement>(null),questions=exercise.stages.flatMap(s=>s.questions),stage=exercise.stages[stageIndex],scoredCount=questions.filter(q=>q.kind!=='open').length,hasOpen=questions.some(q=>q.kind==='open');
 async function load(){setLoading(true);try{setError('');const d=await request(courseId,`&lessonId=${encodeURIComponent(lessonId)}`);setHistory(d.history);setResult(d.latest);if(d.latest)setAnswers(d.latest.answers);}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
 useEffect(()=>{if(signedIn)load();},[courseId,lessonId,exercise.id,signedIn]);
 const stageDone=(s:SelfCheckStage)=>s.questions.every(q=>isSelfCheckAnswered(q,answers[q.id]));
 const unlocked=(index:number)=>canOpenSelfCheckStage(exercise,answers,index);
 const answered=questions.filter(q=>isSelfCheckAnswered(q,answers[q.id])).length,best=history.length?Math.max(...history.map(a=>a.correct)):null;
 function move(index:number){if(!unlocked(index))return;setStageIndex(index);setError('');top.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 async function submit(){if(questions.some(q=>!isSelfCheckAnswered(q,answers[q.id]))){setError('Ответьте на все вопросы, прежде чем завершить попытку.');return;}setBusy(true);setError('');try{const d:Result=await request(courseId,'','POST',{lessonId,answers});setResult(d);setHistory(h=>[{id:d.id,createdAt:d.createdAt,correct:d.correct,total:d.total,score:d.score},...h].slice(0,100));top.current?.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function retry(){setAnswers({});setResult(null);setStageIndex(0);setError('');top.current?.scrollIntoView({behavior:'smooth',block:'start'});}
 return <div className="self-check" ref={top}>
  <div className="self-check-heading"><span className="self-check-icon"><ListChecks size={25}/></span><div><h2>{exercise.title}</h2><p>{exercise.subtitle}</p></div></div>
  <p className="self-check-instructions">{exercise.instructions}</p>
  <div className="self-check-meta"><span><Clock3 size={16}/>{exercise.durationLabel??'Около 10 минут'}</span><span><CheckCheck size={17}/>По 1 баллу за полностью верное задание</span>{best!==null&&<strong>Лучший результат: {best} из {scoredCount}</strong>}</div>
  {error&&<div className="self-check-error" role="alert"><AlertCircle size={18}/><span>{error}</span></div>}
  {loading?<div className="self-check-loading"><LoaderCircle size={24} className="spin"/><span>Загружаем ваши результаты…</span><button className="text-button" onClick={load}>Повторить</button></div>:result?<>
   <section className="self-check-result" aria-live="polite"><span className="self-check-result-score">{result.correct}<small> / {result.total}</small></span><div><h3>Самопроверка завершена</h3><p>{result.correct===result.total?(hasOpen?'Все задания с автоматической проверкой выполнены верно. Письменное объяснение сравните с разбором.':'Вы верно ответили на все вопросы.'):`Посмотрите пояснения к ответам. Вы можете вернуться к конспекту и повторить попытку.`}</p><span>{new Date(result.createdAt).toLocaleString('ru-RU')}</span></div></section>
   <div className="self-check-result-actions"><button className="button button-primary" onClick={retry}><RotateCcw size={17}/>Пройти ещё раз</button><button className="button button-secondary" onClick={onReading}><BookOpen size={17}/>К материалу урока</button></div>
   <h3 className="self-check-review-title">Ответы и разбор</h3>
   {exercise.stages.map(s=><section className="self-check-review-stage" key={s.id}><StageContext stage={s}/>{s.questions.map(q=><Question key={q.id} question={q} selected={result.answers[q.id]} feedback={result.review.find(r=>r.id===q.id)}/>)}</section>)}
   <p className="self-check-closing">{exercise.closing}</p>
  </>:<>
   <nav className="self-check-steps" style={{gridTemplateColumns:`repeat(${exercise.stages.length},minmax(0,1fr))`}} aria-label="Этапы самопроверки">{exercise.stages.map((s,i)=><button key={s.id} className={stageIndex===i?'active':''} disabled={!unlocked(i)||busy} aria-current={stageIndex===i?'step':undefined} onClick={()=>move(i)}><span>{stageDone(s)?<Check size={15}/>:i+1}</span><strong>Вопрос{s.questions.length>1?'ы':''} {s.questions[0].number}{s.questions.length>1?`–${s.questions.at(-1)!.number}`:''}</strong></button>)}</nav>
   <div className="self-check-stage-label">Этап {stageIndex+1} из {exercise.stages.length} · Отвечено {answered} из {questions.length}</div>
   <StageContext stage={stage}/>
   {stage.questions.map(q=><Question key={q.id} question={q} selected={answers[q.id]} disabled={busy} onSelect={value=>setAnswers(a=>({...a,[q.id]:value}))}/>)}
   {stageIndex===exercise.stages.length-1&&<p className="self-check-closing">{exercise.closing}</p>}
   <div className="self-check-navigation"><button className="button button-secondary" disabled={stageIndex===0||busy} onClick={()=>move(stageIndex-1)}>Назад</button>{stageIndex<exercise.stages.length-1?<button className="button button-primary" disabled={!stageDone(stage)||busy} onClick={()=>move(stageIndex+1)}>{stage.nextLabel??(stageIndex===0?'Открыть данные контролей':'Открыть повторную серию')}</button>:signedIn?<button className="button button-primary" disabled={questions.some(q=>!isSelfCheckAnswered(q,answers[q.id]))||busy} onClick={submit}>{busy?<LoaderCircle className="spin" size={17}/>:<CheckCheck size={17}/>}Завершить и проверить</button>:<a className="button button-primary" href={'/signin-with-chatgpt?return_to='+encodeURIComponent(`/?course=${courseId}#lesson/${lessonId}`)} target="_top"><LogIn size={16}/>Войти и сохранить результат</a>}</div>
   <div className="self-check-help"><span>Ответы и комментарии появятся после завершения попытки.</span><button className="text-button" onClick={onReading}><BookOpen size={16}/>Открыть материал урока</button></div>
  </>}
  {history.length>0&&<section className="self-check-history"><h3><History size={19}/>Мои попытки</h3><div className="table-wrap"><table><thead><tr><th>Дата</th><th>Верных заданий</th><th>Результат</th></tr></thead><tbody>{history.map(a=><tr key={a.id}><td>{new Date(a.createdAt).toLocaleString('ru-RU')}</td><td>{a.correct} из {a.total}</td><td>{a.score}%</td></tr>)}</tbody></table></div></section>}
 </div>;
}
function StageContext({stage}:{stage:SelfCheckStage}){return <div className="self-check-context"><h3>{stage.title}</h3>{stage.body.split('\n\n').map((p,i)=><p key={i}>{p}</p>)}{stage.table&&<div className="table-wrap self-check-controls"><table><caption>Данные учебной серии</caption><thead><tr>{stage.table.headers.map((h,i)=><th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{stage.table.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th key={j} scope="row">{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}</div>;}
function Question({question:q,selected,onSelect,disabled,feedback}:{question:SelfCheckQuestion;selected?:SelfCheckAnswer;onSelect?:(value:SelfCheckAnswer)=>void;disabled?:boolean;feedback?:Feedback}){
 const values=Array.isArray(selected)?selected:[];
 const state=feedback?(feedback.isCorrect===null?'is-manual':feedback.isCorrect?'is-correct':'is-incorrect'):'';
 const correctLabel=feedback?.correct===undefined?'':Array.isArray(feedback.correct)
  ?feedback.correct.map((v,i)=>q.kind==='matching'?`${i+1}–${letters[v]}`:letters[v]).join(q.kind==='order'?' → ':', ')
  :letters[feedback.correct];
 return <fieldset className={`self-check-question ${state}`} disabled={disabled||!!feedback}>
  <legend><span>{q.number}.</span>{q.prompt}</legend>
  {q.image&&<figure className="self-check-figure"><img src={q.image.url} alt={q.image.alt}/><figcaption>{q.image.caption}</figcaption></figure>}
  {q.kind==='open'?<div className="self-check-written"><label htmlFor={`self-${q.id}`}>{feedback?'Ваше объяснение':'Ваш ответ · 1–2 предложения'}</label><textarea id={`self-${q.id}`} rows={5} maxLength={SELF_CHECK_TEXT_LIMIT} value={typeof selected==='string'?selected:''} onChange={e=>onSelect?.(e.target.value)} placeholder="Напишите, что задаёт начало и конец копии…"/><span>{typeof selected==='string'?selected.length:0} / {SELF_CHECK_TEXT_LIMIT} символов</span></div>
   :q.kind==='order'||q.kind==='matching'?<div className="self-check-pairs">
    <ol className="self-check-options" aria-label={q.kind==='order'?'События':'Участники реакции'}>{q.options.map((option,i)=><li key={i}><strong>{letters[i]}.</strong> {option}</li>)}</ol>
    <p className="self-check-input-hint">{q.kind==='order'?'Выберите событие для каждого шага цикла.':'Выберите участника для каждой роли.'} Каждый вариант используется один раз.</p>
    {(q.kind==='matching'?q.roles:q.options.map((_,i)=>`Шаг ${i+1}`)).map((label,i)=><label className="self-check-pair" key={i} htmlFor={`self-${q.id}-${i}`}><span>{q.kind==='matching'?`${i+1}. ${label}`:label}</span><select id={`self-${q.id}-${i}`} value={values[i]??-1} onChange={e=>{const next=Array.from({length:q.options.length},(_,j)=>values[j]??-1);next[i]=Number(e.target.value);onSelect?.(next);}}><option value={-1}>Выберите вариант</option>{q.options.map((option,j)=><option key={j} value={j} disabled={values.some((v,k)=>k!==i&&v===j)}>{letters[j]}.{q.kind==='matching'?` ${option}`:''}</option>)}</select></label>)}
   </div>
   :q.options.map((option,i)=>{
    const multiple=q.kind==='multiple',checked=multiple?values.includes(i):selected===i;
    const correct=Array.isArray(feedback?.correct)?feedback.correct.includes(i):feedback?.correct===i;
    return <label key={i} className={`${checked?'selected':''} ${correct?'correct-answer':''}`}><input type={multiple?'checkbox':'radio'} name={`self-${q.id}`} checked={checked} disabled={disabled||!!feedback||(multiple&&!checked&&values.length>=q.selectionCount)} onChange={()=>onSelect?.(multiple?(checked?values.filter(v=>v!==i):[...values,i]):i)}/><span className="self-check-letter">{letters[i]}.</span><span>{option}</span>{correct&&<Check size={18}/>}</label>;
   })}
  {q.kind==='multiple'&&!feedback&&<p className="self-check-input-hint">Выбрано {values.length} из {q.selectionCount}. Чтобы изменить выбор, снимите одну отметку.</p>}
  {feedback&&<div className="self-check-feedback">
   <strong>{feedback.isCorrect===null?'Письменное объяснение · без автоматической оценки':feedback.isCorrect?'Верно · 1 балл':`0 баллов · Правильный ответ: ${correctLabel}`}</strong>
   {feedback.isCorrect===null?<><p>Сравните свой ответ по двум признакам:</p><ul className="self-check-rubric">{feedback.rubric?.map((item,i)=><li key={i}>{item}</li>)}</ul></>:feedback.explanation.split('\n\n').map((p,i)=><p key={i}>{p}</p>)}
   {q.reference&&<p className="self-check-reference">{q.reference}</p>}
  </div>}
 </fieldset>;
}
