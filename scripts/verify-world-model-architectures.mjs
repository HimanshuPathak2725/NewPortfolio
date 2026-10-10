import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {parseFragment} from 'parse5';
const compile=name=>ts.transpileModule(fs.readFileSync(`src/lib/world-models/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const modules={};
for(const name of ['architecture-diagrams','architecture-scenes','architecture-art']){const exports={};vm.runInNewContext(compile(name),{exports,require:p=>modules[p.replace('./','')]});modules[name]=exports;}
const {architectureScenes}=modules['architecture-scenes'],{renderArchitectureScene,renderArchitectureSvg}=modules['architecture-art'];
const scenes=Object.values(architectureScenes).flat();assert.equal(scenes.length,13);
for(const [family,scenes] of Object.entries(architectureScenes)){
 assert.equal(fs.readFileSync(`public/images/world-models/architecture-${family}.svg`,'utf8'),renderArchitectureSvg(family),'Exports must match the published figure source.');
 for(const scene of scenes){
  const names=scene.nodes.map(n=>n.id);assert.equal(names.length,new Set(names).size);
  for(const edge of scene.edges)assert.ok(names.includes(edge.from)&&names.includes(edge.to),`Unresolved connection in ${scene.id}`);
  for(const compact of [false,true]){
   const svg=renderArchitectureScene(scene,compact);assert.ok(!/NaN|undefined|Infinity/.test(svg));
   const ids=[],refs=[];let paths=0;
   function walk(n){const a=Object.fromEntries((n.attrs??[]).map(a=>[a.name,a.value]));if(a.id)ids.push(a.id);for(const v of Object.values(a))for(const match of v.matchAll(/url\(#([^)]*)\)/g))refs.push(match[1]);if('data-arch-path' in a)paths++;for(const c of n.childNodes??[])walk(c);}
   walk(parseFragment(svg));assert.equal(ids.length,new Set(ids).size);assert.ok(refs.every(id=>ids.includes(id)));assert.equal(paths,scene.edges.length);
  }
 }
}
// Architectural distinctions that a generic three-node template would lose.
const scene=id=>scenes.find(s=>s.id===id),edge=(id,a,b)=>scene(id).edges.find(e=>e.from===a&&e.to===b);
assert.ok(edge('rssm','memory','prior')&&edge('rssm','memory','posterior'));
assert.ok(edge('muzero','root','froot'),'MuZero must predict priors at the search root.');
assert.ok(edge('jepa-pretrain','encoder','target').relation==='parameter');
assert.ok(edge('genie-inference','masked','dynamics')&&edge('genie-inference','dynamics','filled'));
assert.ok(edge('iris-behavior','actor','world')&&edge('iris-behavior','world','tokens'));
assert.ok(edge('cosmos','tokenizer','noise')&&edge('cosmos','noise','dit'));
console.log('PASS architecture graphs: thirteen scenes, twenty-six compositions, scoped representation paths, resolved SVG references, and export parity.');

class Element{
 constructor(){this.dataset={};this.style={};this.listeners={};this.attributes={};this.hidden=false;this.textContent='';}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 removeEventListener(name,fn){this.listeners[name]=(this.listeners[name]??[]).filter(f=>f!==fn);}
 fire(name){for(const fn of [...(this.listeners[name]??[])])fn({});}
 setAttribute(k,v){this.attributes[k]=v;}
}
for(const reduced of [false,true]){
 const root=new Element();root.dataset={steps:JSON.stringify(['observe','predict','learn']),intro:'Complete architecture'};
 const slots=Object.fromEntries(['[data-arch-play]','[data-arch-next]','[data-arch-all]','[data-arch-explanation]','[data-arch-count]','.wm-architecture-controls'].map(k=>[k,new Element()]));
 const units=[0,1,2].map(i=>{const u=new Element();u.dataset.step=String(i);return u;});
 const packets=[],paths=units.map(unit=>{const p=new Element(),packet=new Element();packets.push(packet);p.parentElement=unit;unit.querySelector=()=>packet;p.getClientRects=()=>[{}];p.getTotalLength=()=>100;p.getPointAtLength=n=>({x:n,y:0});return p;});
 root.querySelector=s=>slots[s];root.querySelectorAll=s=>s==='[data-arch-unit]'?units:paths;
 const document=new Element();document.querySelectorAll=()=>[root];document.hidden=false;
 const pref=new Element();pref.matches=reduced;const window=new Element();let observer;
 class IntersectionObserver{constructor(fn){this.fn=fn;observer=this;}observe(){}disconnect(){this.disconnected=true;}enter(v){this.fn([{isIntersecting:v}]);}}
 window.IntersectionObserver=IntersectionObserver;
 let frameId=0,now=0;const frames=new Map();
 const sandbox={exports:{},document,window,matchMedia:()=>pref,IntersectionObserver,requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id)};
 vm.runInNewContext(compile('architecture-motion'),sandbox);sandbox.exports.initArchitectureMotion();
 const tick=ms=>{for(let i=0;i<ms/100;i++){now+=100;for(const [id,fn]of [...frames]){frames.delete(id);fn(now);}}};
 const click=s=>slots[s].fire('click');
 assert.equal(frames.size,0);observer.enter(true);assert.equal(frames.size,reduced?0:1);
 if(reduced)click('[data-arch-play]');tick(1000);assert.equal(slots['[data-arch-count]'].textContent,'1 / 3');
 if(reduced)assert.ok(packets.every(p=>p.attributes.opacity==='0'));else assert.ok(Number(packets[0].attributes.opacity)>0);
 click('[data-arch-play]');assert.equal(frames.size,0);
 click('[data-arch-next]');assert.equal(slots['[data-arch-count]'].textContent,'2 / 3');assert.equal(frames.size,0);
 click('[data-arch-all]');assert.ok(units.every(u=>u.style.opacity==='1'));assert.equal(slots['[data-arch-explanation]'].textContent,'Complete architecture');
 click('[data-arch-play]');tick(21000);assert.equal(frames.size,0);assert.ok(units.every(u=>u.style.opacity==='1'));
 click('[data-arch-play]');observer.enter(false);assert.equal(frames.size,0);observer.enter(true);assert.equal(frames.size,0,'Re-entry must preserve a paused walkthrough.');
 click('[data-arch-play]');document.hidden=true;document.fire('visibilitychange');assert.equal(frames.size,0);document.hidden=false;
 click('[data-arch-play]');pref.matches=true;pref.fire('change');assert.equal(frames.size,0);assert.ok(units.every(u=>u.style.opacity==='1'));
 window.fire('pagehide');assert.ok(observer.disconnected);assert.equal(pref.listeners.change.length,0);assert.equal(document.listeners.visibilitychange.length,0);
 console.log(`PASS architecture playback (reduced motion ${reduced?'on':'off'}): pause, step, complete, visibility, preference changes, and cleanup.`);
}
console.log('Playback tests use a simulated DOM; visual SVG inspection is separate from browser layout verification.');
