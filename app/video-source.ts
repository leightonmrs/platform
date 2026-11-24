export type VideoSource = { type:'native'|'embed'|'external'|'empty'; url:string };
export function videoSource(url:string,autoPlay=false):VideoSource {
 if(!url)return {type:'empty',url:''};
 if(/^\/api\/files\/[a-zA-Z0-9_-]+$/.test(url))return {type:'native',url};
 let u:URL;try{u=new URL(url);}catch{return {type:'empty',url:''};}
 if(u.protocol!=='https:')return {type:'empty',url:''};
 if(['www.youtube.com','youtube.com','youtu.be','www.youtube-nocookie.com'].includes(u.hostname)){
  const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')??u.pathname.split('/').at(-1);
  if(id&&/^[\w-]{11}$/.test(id))return {type:'embed',url:`https://www.youtube-nocookie.com/embed/${id}?playsinline=1${autoPlay?'&autoplay=1&mute=1':''}`};
 }
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(u.hostname)){
  const id=u.pathname.split('/').at(-1);if(id&&/^\d+$/.test(id))return {type:'embed',url:`https://player.vimeo.com/video/${id}?playsinline=1${autoPlay?'&autoplay=1&muted=1':''}`};
 }
 if(/\.(mp4|webm)$/i.test(u.pathname))return {type:'native',url};
 return {type:'external',url};
}
