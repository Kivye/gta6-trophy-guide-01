import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const html=readFileSync('app/index.html','utf8');
const doc=JSON.parse(readFileSync('app/data/trophies.json','utf8'));
// Fingerprint of the starter's official names, descriptions and grades.
const facts=doc.trophies.map(({name,description,grade})=>({name,description,grade}));
assert.equal(createHash('sha256').update(JSON.stringify(facts)).digest('hex'),'b107b6ffcd78b849de4e94fdbca9aeca7964ef6f0b0876fed6e6824b5b0291ff');
assert.equal(doc.trophies.length,55);
assert.equal(new Set(doc.trophies.map(t=>t.name)).size,55);
for(const t of doc.trophies){
 assert.ok(['story','collectible','misc'].includes(t.kind));
 assert.match(t.guide,/\nSources: Output Lag.*GTABase.*19 Nov 2026/);
 const sentences=t.guide.split('\n')[0].split(/(?<=[.!?])\s+(?=[A-Z])/).length;
 assert.ok(sentences>=2 && sentences<=5,`${t.name}: ${sentences} guide sentences`);
}
assert.equal(doc.trophies.filter(t=>t.hidden).length,28);
assert.equal(doc.trophies.filter(t=>t.missable===true).length,0);
assert.deepEqual(doc.trophies.filter(t=>t.missable).map(t=>t.name),['Positive Mental Attitude']);
assert.deepEqual(['platinum','gold','silver','bronze'].map(g=>doc.trophies.filter(t=>t.grade===g).length),[1,2,6,46]);
assert.deepEqual(JSON.parse(html.match(/<script id="trophy-data" type="application\/json">([\s\S]*?)<\/script>/)[1]),doc);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|https?:\/\//.test(readFileSync('app/app.js','utf8')));
const checks=[];
class Element{
 constructor(id){this.id=id;this.value='all';this.textContent='';this.innerHTML='';this.hidden=true;this.checked=false;this.dataset={};this.files=[];this.listeners={};this.styles={};this.classes=new Set();this.style={setProperty:(k,v)=>this.styles[k]=v};this.classList={toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k)};this.options=[];}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
 async emit(type, target=this){for(const fn of this.listeners[type]??[])await fn({target});}
 click(){return this.emit('click')}
 scrollIntoView(){this.scrolled=true}
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
for(const id of ['grade','kind','status','missable']){
 const select=html.match(new RegExp(`<select id="${id}">([\\s\\S]*?)<\\/select>`))[1];
 elements[id].options=[...select.matchAll(/value="([^"]+)"/g)].map(x=>({value:x[1]}));
}
elements['trophy-data'].textContent=JSON.stringify(doc);elements.search.value='';
let store={};let eventHandlers={};let exported;
const location={hash:''};
const document={getElementById:id=>elements[id],body:new Element('body'),createElement:()=>new Element('download')};
const context={document,location,history:{replaceState:(a,b,hash)=>location.hash=hash},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v},window:{addEventListener:(type,fn)=>eventHandlers[type]=fn,scrollTo:()=>{}},URLSearchParams,URL:{createObjectURL:blob=>{exported=blob;return 'blob:progress'},revokeObjectURL:()=>{}},Blob,setTimeout:()=>1,clearTimeout:()=>{},requestAnimationFrame:fn=>fn(),console};
runInNewContext(readFileSync('app/app.js','utf8'),context);
const rows=()=>[...elements.rows.innerHTML.matchAll(/<article class="trophy /g)].length;
const hash=value=>{location.hash=value;eventHandlers.hashchange()};
assert.equal(rows(),55);checks.push('55 checklist rows');
assert.equal(elements.percent.textContent,'0%');
const check=new Element('check');check.dataset.check='15';check.checked=true;await elements.rows.emit('change',check);
assert.equal(elements.percent.textContent,'2%');
assert.equal(JSON.parse(store['leonida-ledger-v1']).counts['15'],250);
checks.push('Check-off, grade summaries, count completion and localStorage');
const counter=new Element('counter');counter.dataset.counter='15';counter.value='999';await elements.rows.emit('change',counter);assert.equal(counter.value,250);
counter.value='-5';await elements.rows.emit('change',counter);assert.equal(counter.value,0);checks.push('Counter bounds');
for(const [grade,n] of [['platinum',1],['gold',2],['silver',6],['bronze',46]]){hash('#grade='+grade);assert.equal(rows(),n)}checks.push('All grade filters');
hash('#kind=story');assert.equal(rows(),18);
hash('#missable=reported');assert.equal(rows(),1);
hash('#missable=confirmed');assert.equal(rows(),0);assert.equal(elements.empty.hidden,false);
hash('#status=done');assert.equal(rows(),1);checks.push('Kind, status and honest missable filters');
hash('#q=positive');assert.equal(rows(),1);assert.match(elements.rows.innerHTML,/Positive Mental Attitude/);checks.push('Name search');
hash('#spoiler=1&grade=bronze&status=open&backup=1');assert.equal(rows(),46);assert.ok(!elements.rows.innerHTML.includes('T**s Ass Drug Money'));assert.match(elements.rows.innerHTML,/Spoiler-protected trophy/);assert.equal(elements.backup.hidden,false);checks.push('Spoiler masking and backup hash state');
hash('#guide=positive-mental-attitude');assert.match(elements.rows.innerHTML,/<details open>/);assert.match(elements.rows.innerHTML,/Sources: Output Lag/);assert.match(elements.rows.innerHTML,/REPORTED, UNCONFIRMED/);checks.push('Guide deep link and visible citation');
hash('#view=roadmap');assert.equal(elements.roadmap.hidden,false);assert.equal(elements.roadmap.scrolled,true);checks.push('Roadmap deep link and scroll');
hash('#');await elements.export.click();const backup=JSON.parse(await exported.text());assert.deepEqual(backup.earned,[15]);checks.push('Exported JSON backup');
elements.import.files=[{size:100,text:async()=>JSON.stringify({version:1,earned:[2,3,7],counts:{'15':87}})}];await elements.import.emit('change');assert.equal(JSON.parse(store['leonida-ledger-v1']).earned.length,3);assert.match(elements['import-status'].textContent,/Imported 3/);checks.push('Valid import replaces progress');
elements.import.files=[{size:100,text:async()=>JSON.stringify({version:1,earned:[999],counts:{}})}];await elements.import.emit('change');assert.equal(JSON.parse(store['leonida-ledger-v1']).earned.length,3);assert.match(elements['import-status'].textContent,/Import failed/);checks.push('Invalid import preserves progress');
const beforeDemo=store['leonida-ledger-v1'];hash('#demo=1');assert.equal(elements.percent.textContent,'13%');assert.equal(JSON.parse(store['leonida-ledger-v1']).earned.length,3);hash('#');assert.equal(store['leonida-ledger-v1'],beforeDemo);assert.equal(elements.progress.textContent,'3 / 55 earned');checks.push('Demo isolation and restoring saved state');
console.log('DATA + INTERACTION HARNESS PASS\n'+checks.map(x=>'✓ '+x).join('\n'));
console.log('Note: this harness tests state and rendered HTML strings; it does not substitute for Chrome visual verification.');
