'use client';
import { useEffect,useRef,useState } from 'react';
import { Video,Play,ExternalLink,Volume2,TriangleAlert } from 'lucide-react';
import { videoSource } from './video-source';
export default function VideoPlayer({url,autoPlay=false,title='Видео урока'}:{url:string;autoPlay?:boolean;title?:string}){
 const source=videoSource(url,autoPlay),ref=useRef<HTMLVideoElement>(null);
 const [muted,setMuted]=useState(autoPlay),[blocked,setBlocked]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{
  setMuted(autoPlay);setBlocked(false);setError(false);
  const player=ref.current;if(!player)return;player.muted=autoPlay;
  if(autoPlay)player.play().catch(()=>setBlocked(true));
 },[url,autoPlay]);
 async function start(){try{await ref.current?.play();setBlocked(false);}catch{setBlocked(true);}}
 function unmute(){const p=ref.current;if(p){p.muted=false;setMuted(false);}}
 if(source.type==='empty')return <div className="video-empty"><Video size={40}/><h3>Добавьте видео к уроку</h3><p>Загрузите MP4 / WebM в редакторе курса или укажите ссылку на видеолекцию.</p></div>;
 if(source.type==='embed')return <div className="lesson-video"><iframe key={source.url} className="video-player" src={source.url} title={title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>{autoPlay&&<p className="video-playback-hint">Автозапуск без звука. Включите звук в плеере.</p>}</div>;
 if(source.type==='external')return <a className="video-external" href={source.url} target="_blank" rel="noreferrer"><Play size={30}/><div><h3>Открыть видеолекцию</h3><p>Видео откроется на сайте автора</p></div><ExternalLink size={20}/></a>;
 return <div className="lesson-video"><video ref={ref} className="video-player" src={source.url} controls autoPlay={autoPlay} muted={muted} playsInline preload="metadata" aria-label={title} onPlay={()=>setBlocked(false)} onVolumeChange={()=>{if(ref.current)setMuted(ref.current.muted);}} onError={()=>setError(true)} />{error?<div className="video-playback-error" role="alert"><TriangleAlert size={18}/><span>Не удалось воспроизвести видео. Проверьте подключение; если ошибка повторяется, автору нужно проверить файл и его формат.</span></div>:<>{blocked&&<button className="button button-primary video-start-button" onClick={start}><Play size={17}/>Запустить видео</button>}{autoPlay&&muted&&<div className="video-audio-bar"><span>Видео запускается без звука</span><button className="button button-secondary compact" onClick={unmute}><Volume2 size={17}/>Включить звук</button></div>}</>}</div>;
}
