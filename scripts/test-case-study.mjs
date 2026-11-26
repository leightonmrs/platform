import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
const nativeRequire=createRequire(import.meta.url);
function compile(path,overrides={}) {
 const out=ts.transpileModule(readFileSync(path,'utf8'),{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};
 new Function('require','module','exports',out)(name=>overrides[name]??nativeRequire(name),m,m.exports);
 return m.exports;
}
const course=compile('app/course.ts'),data=compile('app/case-study-data.ts',{'./course':course}),service=compile('app/case-study-service.ts');
const Component=compile('app/case-study.tsx',{'./case-study-service':service}).default,version=compile('app/content-version.ts');
const exercise=data.lesson11Case,publicCourse=data.attachDefaultCaseStudy(structuredClone(course.initialCourse),'main');
course.hideAnswerKeys(publicCourse);
const learnerCase=publicCourse.modules[0].lessons[0].caseStudy;
let checks=0;function check(ok,label){assert.ok(ok,label);checks++;console.log('PASS',label);}
check(!service.canOpenCaseStage(exercise,{},1),'second part locked until three written answers');
const firstAnswers=Object.fromEntries(exercise.stages[0].questions.map(q=>[q.id,'Мой ответ']));
check(!service.canOpenCaseStage(exercise,{...firstAnswers,'case11-q2':'  \n'},1),'whitespace does not unlock new data');
check(service.canOpenCaseStage(exercise,firstAnswers,1),'three substantive answers unlock second part');
const html=renderToStaticMarkup(React.createElement(Component,{exercise:learnerCase,lessonId:'l1',courseId:'main',signedIn:false,onReading(){}}));
check((html.match(/<textarea/g)??[]).length===3,'first part renders three open-answer textareas');
check(html.includes('К-031')&&html.includes('К-013'),'source identifiers appear in the first-part table');
check(!html.includes(exercise.stages[1].body),'new facts remain hidden before first-part responses');
check(!html.includes(exercise.solution.report)&&!html.includes(exercise.stages[0].questions[0].modelAnswer),'model answers absent from initial rendered case');
check(!JSON.stringify(learnerCase).includes('modelAnswer')&&!learnerCase.solution,'solutions removed from student transport');
const untouched=data.attachDefaultCaseStudy(structuredClone(course.initialCourse),'other');
check(!untouched.modules[0].lessons[0].caseStudy,'source case attaches only to the main PCR course');
const disabled=structuredClone(course.initialCourse);disabled.modules[0].lessons[0].caseStudy=null;
check(data.attachDefaultCaseStudy(disabled,'main').modules[0].lessons[0].caseStudy===null,'explicitly disabled case is preserved');
const authored=structuredClone(course.initialCourse);authored.modules[0].lessons[0].body='Авторский конспект';authored.modules[0].lessons[0].videoUrl='https://example.test/lecture.mp4';
data.attachDefaultCaseStudy(authored,'main');
check(authored.modules[0].lessons[0].body==='Авторский конспект'&&authored.modules[0].lessons[0].videoUrl==='https://example.test/lecture.mp4','attaching case preserves live lesson text and video');
check(await version.contentVersion(exercise)===await version.contentVersion(Object.fromEntries(Object.entries(exercise).reverse())),'case version survives author JSON key reordering');
console.log(`${checks} case UI and progression checks passed.`);
