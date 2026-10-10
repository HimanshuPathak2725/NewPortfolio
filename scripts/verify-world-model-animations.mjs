import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {parseFragment} from 'parse5';
const compile=name=>ts.transpileModule(fs.readFileSync(`src/lib/world-models/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const core={};vm.runInNewContext(compile('experiments'),{exports:core});
const drawings={};vm.runInNewContext(compile('animated-figures'),{exports:drawings,require:()=>core});
const kinds=Object.keys(drawings.animationNotes);
for(const kind of kinds)for(const compact of [false,true])for(const progress of [0,.2,.5,.7,.9,1]){
 const frame=drawings.renderAnimationFrame(kind,progress,compact);
 assert.ok(!/NaN|Infinity|undefined/.test(frame.markup));
 assert.ok(frame.width>0&&frame.height>0&&frame.phase.length>10);
 const ids=[],references=[];
 function walk(node){const attributes=Object.fromEntries((node.attrs??[]).map(a=>[a.name,a.value]));if(attributes.id)ids.push(attributes.id);for(const value of Object.values(attributes))for(const match of value.matchAll(/url\(#([^)]*)\)/g))references.push(match[1]);for(const child of node.childNodes??[])walk(child);}
 walk(parseFragment(`<svg xmlns="http://www.w3.org/2000/svg">${frame.markup}</svg>`));
 assert.equal(ids.length,new Set(ids).size);
 assert.ok(references.every(id=>ids.includes(id)),'Every SVG marker, pattern, and clip must exist in the same frame.');
 assert.notEqual(drawings.renderAnimationFrame(kind,0,compact).markup,drawings.renderAnimationFrame(kind,1,compact).markup);
}
console.log('PASS frames: five changing SVG sequences, desktop/mobile layouts, finite geometry, unique IDs, and resolved markers/patterns/clips.');
class Element{
 constructor(){this.attributes={};this.dataset={};this.listeners={};this.hidden=true;this.textContent='';this.innerHTML='';}
 setAttribute(name,value){this.attributes[name]=value;}
 addEventListener(name,callback){(this.listeners[name]??=[]).push(callback);}
 fire(name){for(const callback of this.listeners[name]??[])callback();}
}
for(const reducedInitially of [false,true]){
 const roots=kinds.map(kind=>{const root=new Element();root.dataset.animatedFigure=kind;root.width=800;root.slots=Object.fromEntries(['svg','[data-motion-scene]','.wm-animation-controls','[data-motion-toggle]','[data-motion-phase]'].map(s=>[s,new Element()]));root.querySelector=s=>root.slots[s];root.getBoundingClientRect=()=>({width:root.width});return root;});
 const document=new Element();document.hidden=false;document.querySelectorAll=()=>roots;
 const preference=new Element();preference.matches=reducedInitially;
 const window=new Element(),observers=[],resizers=[];
 class IntersectionObserver{constructor(callback){this.callback=callback;observers.push(this);}observe(root){this.root=root;}disconnect(){this.disconnected=true;}enter(visible){this.callback([{isIntersecting:visible}]);}}
 class ResizeObserver{constructor(callback){this.callback=callback;resizers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 Object.assign(window,{IntersectionObserver,ResizeObserver});
 let now=0,nextId=0;const frames=new Map();
 const sandbox={exports:{},require:()=>drawings,document,window,matchMedia:()=>preference,IntersectionObserver,ResizeObserver,performance:{now:()=>now},requestAnimationFrame:callback=>{frames.set(++nextId,callback);return nextId;},cancelAnimationFrame:id=>frames.delete(id)};
 vm.runInNewContext(compile('animations'),sandbox);sandbox.exports.initArticleAnimations();
 assert.equal(frames.size,0,'Offscreen figures must stay still.');
 for(let i=0;i<roots.length;i++){
  const root=roots[i],button=root.querySelector('[data-motion-toggle]'),scene=root.querySelector('[data-motion-scene]');
  assert.equal(root.querySelector('.wm-animation-controls').hidden,false);
  assert.ok(scene.innerHTML.length>100);
  observers[i].enter(true);
  assert.equal(frames.size,reducedInitially?0:1,'Automatic playback must respect reduced motion.');
  if(reducedInitially)button.fire('click');
  assert.equal(frames.size,1,'Explicit playback remains available.');
  const initial=scene.innerHTML;
  for(let tick=0;tick<20;tick++){now+=50;for(const [id,callback] of [...frames]){frames.delete(id);callback(now);}}
  assert.ok(scene.innerHTML!==initial,`${root.dataset.animatedFigure} should advance when played.`);
  observers[i].enter(false);assert.equal(frames.size,0,'Leaving the viewport must pause playback.');
  observers[i].enter(true);assert.equal(frames.size,0,'Re-entry must not override a paused figure.');
  button.fire('click');assert.equal(frames.size,1);
  let iterations=0;
  while(frames.size&&iterations++<600){now+=50;for(const [id,callback] of [...frames]){frames.delete(id);callback(now);}}
  assert.equal(frames.size,0,'Each animation must stop at its final frame.');
  assert.equal(button.textContent,'Replay ↻');
  root.width=360;resizers[i].callback();assert.ok(root.querySelector('svg').attributes.viewBox.startsWith('0 0 440 '));
  button.fire('click');document.hidden=true;document.fire('visibilitychange');assert.equal(frames.size,0);document.hidden=false;
 }
 preference.matches=true;preference.fire('change');
 assert.ok(roots.every(root=>root.querySelector('[data-motion-toggle]').textContent==='Replay ↻'));
 assert.equal(frames.size,0);
 window.fire('pagehide');assert.ok(observers.every(o=>o.disconnected)&&resizers.every(o=>o.disconnected));
 console.log(`PASS playback (reduced motion ${reducedInitially?'on':'off'}): visibility, explicit pause/play, one-shot completion, resize, hidden tab, preference changes, and observer cleanup.`);
}
console.log('Playback checks use a simulated DOM; they do not verify browser layout or frame pacing.');
