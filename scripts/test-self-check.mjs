import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
const nativeRequire=createRequire(import.meta.url);
function compile(path,overrides={}){const source=readFileSync(path,'utf8'),out=ts.transpileModule(source,{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};new Function('require','module','exports',out)(name=>overrides[name]??nativeRequire(name),m,m.exports);return m.exports;}
const course=compile('app/course.ts'),data=compile('app/self-check-data.ts',{'./course':course,'./self-check-lesson12-data':compile('app/self-check-lesson12-data.ts')}),flow=compile('app/self-check-flow.ts'),service=compile('app/self-check-service.ts',{'./content-version':compile('app/content-version.ts'),'./self-check-flow':flow}),Component=compile('app/self-check.tsx',{'./self-check-flow':flow}).default;
const exercise=data.lesson11SelfCheck,publicCourse=data.attachDefaultSelfCheck(structuredClone(course.initialCourse),'main');course.hideAnswerKeys(publicCourse);const publicExercise=publicCourse.modules[0].lessons[0].selfCheck;
let checks=0;function check(ok,label){assert.ok(ok,label);checks++;console.log('PASS',label);}
check(!flow.canOpenSelfCheckStage(exercise,{},1),'control data remain locked before questions one through three');
check(!flow.canOpenSelfCheckStage(exercise,{'pcr11-q1':1,'pcr11-q2':2},1),'two first-stage answers are insufficient');
const phase1={'pcr11-q1':1,'pcr11-q2':2,'pcr11-q3':0};
check(flow.canOpenSelfCheckStage(exercise,phase1,1),'first three answers unlock the control table');
check(!flow.canOpenSelfCheckStage(exercise,phase1,2),'repeat series stays locked until question four');
check(flow.canOpenSelfCheckStage(exercise,{...phase1,'pcr11-q4':1},2),'question four unlocks the repeat series');
check(!flow.canOpenSelfCheckStage(exercise,{},-1),'invalid stage cannot open');
const html=renderToStaticMarkup(React.createElement(Component,{exercise:publicExercise,lessonId:'l1',courseId:'main',signedIn:false,onReading(){}}));
check((html.match(/type="radio"/g)??[]).length===9,'first screen renders exactly three single-choice questions');
check(html.includes('/self-check/pcr-curves-lesson-1-1.png'),'source graph appears on first screen');
check(!html.includes('Появился сигнал мишени.'),'control table not shown prematurely');
check(!html.includes('После проверки выполнена новая серия.'),'repeat series not shown prematurely');
check(!html.includes(exercise.stages[0].questions[0].explanation),'feedback not shown before attempt');
const signature=await service.selfCheckVersion(exercise),reordered=Object.fromEntries(Object.entries(exercise).reverse());
check(await service.selfCheckVersion(reordered)===signature,'version is stable under JSON key reordering');
check(service.gradeSelfCheck(exercise,{...phase1,'pcr11-q4':1,'pcr11-q5':2}).correct===5,'source key earns exactly five points');
const enrolledClone=data.attachDefaultSelfCheck(structuredClone(course.initialCourse),'other');check(!enrolledClone.modules[0].lessons[0].selfCheck,'default exercise attaches only to the PCR course');
console.log(`${checks} self-check UI and scoring checks passed.`);
