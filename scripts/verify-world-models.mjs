import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {parse} from 'parse5';
const experiments={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/world-models/experiments.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:experiments});
const {fitDynamics,gaussianUpdate,spring,ensemble,plan,REAL_DYNAMICS}=experiments;
const fitted=fitDynamics(192,0).history.at(-1);
assert.ok(Math.abs(fitted.stiffness-.8)<0.001 && Math.abs(fitted.damping-.15)<0.001,'Noise-free fit must recover the generating parameters.');
for(const count of [12,96,192])for(const noise of [0,.03,.2]){
 const history=fitDynamics(count,noise).history;
 assert.ok(history.at(-1).testLoss<history[0].testLoss,'Training should improve the held-out predictor for supported controls.');
 assert.ok(history.every(point=>Number.isFinite(point.trainLoss)&&Number.isFinite(point.testLoss)));
}
const posterior=gaussianUpdate(.6,.25);
assert.ok(Math.abs(posterior.mean-.48)<1e-12 && Math.abs(posterior.sigma**2-.05)<1e-12,'Gaussian update must match the analytic result.');
assert.ok(gaussianUpdate(.6,.05).gain>gaussianUpdate(.6,.8).gain,'More precise evidence should receive greater weight.');
const trueSpring=spring({x:.8,v:0},REAL_DYNAMICS.stiffness,REAL_DYNAMICS.damping);
assert.equal(trueSpring.length,121);
assert.ok(trueSpring.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.v)));
const noSpread=ensemble(0);assert.ok(noSpread.models.every(model=>model.every((point,index)=>point.x===noSpread.models[0][index].x)));
assert.ok(Math.abs(noSpread.models[0][100].x-noSpread.truth[100].x)>.01,'Models can agree and still be wrong.');
const corrected=ensemble(.35,120,8);
for(const model of corrected.models)for(let index=8;index<=120;index+=8)assert.equal(model[index].x,corrected.truth[index].x,'Re-observation must reset the state exactly in this teaching system.');
for(const horizon of [12,28,40])for(const knowsObstacle of [true,false]){
 const result=plan(horizon,knowsObstacle,14);
 assert.equal(result.passes.length,6);
 assert.ok(result.passes.every(pass=>pass.candidates.length===96));
 assert.ok(result.passes.every((pass,index)=>!index||pass.best.cost<=result.passes[index-1].best.cost),'Best candidate should be retained between passes.');
 assert.ok(result.best.controls.every(value=>Math.abs(value)<=1));
 assert.ok(result.actual.states.every(state=>state.x>=.04&&state.x<=.96&&state.y>=.04&&state.y<=.96));
}
const informed=plan(28,true,14),blind=plan(28,false,14);
assert.equal(informed.actual.collided,false);assert.equal(blind.actual.collided,true,'Missing-obstacle example should visibly expose a prediction/execution mismatch.');
assert.ok(Math.hypot(informed.actual.states.at(-1).x-.84,informed.actual.states.at(-1).y-.18)<.08);
console.log('PASS experiment math: fitting, held-out error, Bayesian correction, ensemble ambiguity, re-observation, bounded actions, optimizer progress, and prediction/execution mismatch.');

const html=fs.readFileSync('dist/posts/the-world-models-today/index.html','utf8');
const nodes=[];function walk(node){if(node.tagName)nodes.push(node);for(const child of node.childNodes??[])walk(child);}walk(parse(html));
const attrs=node=>Object.fromEntries(node.attrs.map(attr=>[attr.name,attr.value]));
const ids=nodes.map(attrs).filter(attr=>attr.id).map(attr=>attr.id);
assert.equal(ids.length,new Set(ids).size,'IDs must be unique.');
assert.equal(nodes.filter(node=>node.tagName==='h1').length,1);
assert.equal(nodes.filter(node=>attrs(node)['data-chapter']!==undefined).length,8);
assert.equal(nodes.filter(node=>attrs(node)['data-animated-figure']).length,5);
assert.equal(nodes.filter(node=>attrs(node)['data-family-panel']).length,6);
assert.equal(nodes.filter(node=>attrs(node)['data-architecture-diagram']).length,6,'Each architecture family needs its explanatory figure.');
assert.equal(nodes.filter(node=>attrs(node)['data-architecture-scene']).length,13,'Architecture families need their distinct computational scenes.');
assert.equal(nodes.filter(node=>node.tagName==='svg'&&attrs(node).class?.split(' ').includes('wm-arch-svg')).length,26,'Each architecture scene needs desktop and mobile layouts.');
assert.equal(nodes.filter(node=>attrs(node)['data-complete']).length,0,'An essay should not have course-completion controls.');
assert.equal(nodes.filter(node=>attrs(node)['data-resource-group']).length,12);
assert.equal(nodes.filter(node=>node.tagName==='math').length,5,'Equations should render as native MathML.');
assert.equal(nodes.filter(node=>node.tagName==='canvas').length,0,'Old experiment canvases should be replaced.');
assert.ok(!html.includes('data-parameter=')&&!html.includes('wm-readouts'),'Experiment dashboards should not remain in the essay.');
assert.ok(!html.includes('data-world-demo='),'Old basic demos must not appear in the rebuilt hub.');
assert.ok(!html.includes('imagined-futures.webp'),'Old decorative header should not remain in the hub.');
for(const node of nodes){
 const attr=attrs(node);
 if(attr['aria-labelledby'])for(const id of attr['aria-labelledby'].split(' '))assert.ok(ids.includes(id),`Missing accessible label ${id}`);
 for(const url of [attr.href,attr.src].filter(Boolean)){
  if(url.startsWith('#'))assert.ok(ids.includes(decodeURIComponent(url.slice(1))),`Missing anchor ${url}`);
  if(url.startsWith('/')&&!url.startsWith('//')){
   const relative=url.slice(1).split('#')[0].split('?')[0];
   assert.ok(fs.existsSync(path.join('dist',relative.endsWith('/')||!relative?relative+'index.html':relative)),`Missing asset or page ${url}`);
  }
 }
 if(node.tagName==='img')assert.ok(attr.alt,'Teaching figures need useful alt text.');
}
assert.ok(fs.readFileSync('dist/index.html','utf8').includes('/posts/the-world-models-today/'));
assert.ok(fs.readFileSync('dist/posts/index.html','utf8').includes('/posts/the-world-models-today/'));
assert.ok(!fs.existsSync('dist/posts/placeholder-reward-shaping/index.html'));
console.log('PASS rendered hub: eight chapters, five animated figures, six architecture families, twelve resources, navigation, accessible labels, assets, metadata route, and draft exclusion.');
