import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
const nativeRequire=createRequire(import.meta.url);
function compile(path,overrides={}){const source=readFileSync(path,'utf8'),output=ts.transpileModule(source,{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const module={exports:{}};new Function('require','module','exports',output)(name=>overrides[name]??nativeRequire(name),module,module.exports);return module.exports;}
const sources=compile('app/video-source.ts'),{videoSource}=sources,Player=compile('app/video-player.tsx',{'./video-source':sources}).default;
let checks=0;function check(test,label){assert.ok(test,label);checks++;console.log('PASS',label);}
check(videoSource('/api/files/test-id',true).type==='native','uploaded files use native player');
check(videoSource('https://media.example.test/lecture.mp4?token=test').type==='native','signed MP4 URLs keep inline playback');
check(videoSource('https://youtu.be/abcdefghijk',true).url.includes('autoplay=1&mute=1'),'YouTube autoplay is muted');
check(videoSource('https://vimeo.com/1234',true).url.includes('autoplay=1&muted=1'),'Vimeo autoplay is muted');
check(!videoSource('https://youtu.be/abcdefghijk',false).url.includes('autoplay=1'),'manual embed playback preserved');
check(videoSource('javascript:alert(1)').type==='empty','unsafe player links rejected');
const auto=renderToStaticMarkup(React.createElement(Player,{url:'/api/files/test-id',autoPlay:true,title:'Lesson'}));
check(auto.includes('<video')&&auto.includes('autoPlay=""')&&auto.includes('muted=""')&&auto.includes('playsInline=""')&&auto.includes('controls=""'),'autoplay video includes muted inline playback and controls');
check(auto.includes('Включить звук'),'one-click sound control is visible');
const manual=renderToStaticMarkup(React.createElement(Player,{url:'/api/files/test-id',autoPlay:false}));
check(!manual.includes('autoPlay=""')&&!manual.includes('muted=""'),'manual playback does not force autoplay or mute');
check(!manual.includes('Включить звук'),'manual preview has no autoplay sound banner');
console.log(`${checks} video player checks passed.`);
