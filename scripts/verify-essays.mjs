import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {parse,parseFragment} from 'parse5';
import {compile,essayModules} from './essay-modules.mjs';
const {models:m,figures:f}=essayModules();
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const trajectory=m.shapedTrajectory();
near(trajectory.reduce((s,x)=>s+x.discounted,0),4);
near(trajectory.reduce((s,x,i)=>s+.9**i*x.shaped,0),4.729);
// Arbitrary finite trajectories retain exactly the endpoint term.
for(const gamma of [0,.5,.9,1])for(const phi of [[2,-5,3,0],[-4,-3,-2,-1,0],[3,7,3,7,3]]) {
  const steps=m.shapedTrajectory(phi,gamma);
  near(steps.reduce((s,x)=>s+x.discounted,0),-phi[0]+gamma**(phi.length-1)*phi.at(-1));
}
for(const logits of [[0,0,0],[-1,2,4],[6,-2,.3]]) {
  const result=m.bandit(logits);near(result.probabilities.reduce((a,b)=>a+b,0),1);near(result.gradient.reduce((a,b)=>a+b,0),0);
  for(let i=0;i<3;i++){
    const plus=[...logits],minus=[...logits];plus[i]+=1e-5;minus[i]-=1e-5;
    near((m.bandit(plus).value-m.bandit(minus).value)/2e-5,result.gradient[i]);
  }
}
const history=m.banditHistory();assert.ok(history.every((x,i)=>!i||x.value>history[i-1].value));
for(const p of [.1,.5,.9])for(const b of [-3,0,1,2,5])near(m.baselineMoments(b,p).mean,2*p*(1-p));
near(m.baselineMoments(0).variance,1);near(m.baselineMoments(2).variance,0);
for(let n=1;n<=8;n++) {
  const post=m.slopePosterior(n);
  assert.ok(post.variance<m.slopePosterior(n-1).variance);
  const precision=1+m.observations.slice(0,n).reduce((s,d)=>s+d.x*d.x/.09,0);
  near(1/post.variance,precision);
}
const roll=m.rolloutMoments(20);near(roll.epistemic,5.76);near(roll.aleatoric,.8);near(roll.resampled,.288);
for(const strength of [0,.1,.5,1]) {
  const [upper,lower]=m.rewardFork(strength);
  near(upper.total,1.8);near(lower.total,.9);near(upper.advantage,.45);near(lower.advantage,-.45);
  if(strength>0)assert.ok(upper.first<lower.first&&upper.total>lower.total);
  // A consistently transformed critic yields the identical TD residual.
  const vStart=1.35, vUpper=2;
  near(upper.first+.9*(vUpper-upper.phi)-vStart,.9*vUpper-vStart);
}
for(const amount of [0,.1,.5,1])near(m.luckCredit(amount,0).mean,.5);
near(m.luckCredit(0,0).variance,25);near(m.luckCredit(1,0).variance,0);
near(m.luckCredit(1,1).mean,0);near(m.luckCredit(1,1).variance,0);
for(let i=0;i<=100;i++)near(m.possibleWorld(i/100,'upper'),m.possibleWorld(i/100,'lower'));
near(m.possibleWorld(2,'upper'),4);near(m.possibleWorld(2,'lower'),0);
assert.ok(m.possibleWorld(2,'upper')>m.possibleWorld(.8,'upper'));
assert.ok(m.possibleWorld(2,'lower')<m.possibleWorld(.8,'lower'));
near(.2*m.possibleWorld(2,'upper')+.8*m.possibleWorld(2,'lower'),.8);
near(.5*(Math.max(m.possibleWorld(2,'upper'),.8)+Math.max(m.possibleWorld(2,'lower'),.8))-2,.4);
// Identical interventional marginals do not identify individual counterfactual pairing.
const shared=[0,1].map(u=>[u,u]),flipped=[0,1].map(u=>[u,1-u]);
for(const action of [0,1])near(shared.reduce((s,r)=>s+r[action],0)/2,flipped.reduce((s,r)=>s+r[action],0)/2);
assert.ok(shared.every(([a,b])=>a===b)&&flipped.every(([a,b])=>a!==b));
console.log('PASS counterexamples: reversed immediate reward, invariant advantage/TD error, exogenous noise removal versus biased hindsight, indistinguishable worlds with opposite optimal actions, and nonidentified counterfactual pairs.');
console.log('PASS exact examples: telescoping boundaries, finite-difference policy gradients, baseline expectation/variance, Gaussian updates, persistent-drift propagation.');
const walk=node=>[node,...(node.childNodes??[]).flatMap(walk)];
const attrs=node=>Object.fromEntries((node.attrs??[]).map(a=>[a.name,a.value]));
for(const id of Object.keys(f.figures))for(const small of [false,true])for(const t of [0,.13,.25,.5,.75,.99,1]) {
  const svg=f.renderFigure(id,t,small);
  assert.ok(!/NaN|Infinity|undefined/.test(svg));
  const nodes=walk(parseFragment(svg)),ids=nodes.map(attrs).map(a=>a.id).filter(Boolean);
  assert.equal(ids.length,new Set(ids).size);
  assert.ok(nodes.some(n=>n.tagName==='title')&&nodes.some(n=>n.tagName==='desc'));
  assert.notEqual(f.renderFigure(id,0,small),f.renderFigure(id,1,small));
}
for(const id of Object.keys(f.figures))assert.equal(fs.readFileSync(`public/images/essays/${id}.svg`,'utf8'),f.renderFigure(id,f.figures[id].initialProgress??1,false,true));
const slugs=['reward-shaping-without-changing-the-task','policy-gradients-and-the-meaning-of-credit','what-uncertainty-can-tell-a-planner'];
for(const slug of slugs) {
  const html=fs.readFileSync(`dist/posts/${slug}/index.html`,'utf8'),nodes=walk(parse(html));
  const ids=nodes.map(attrs).map(a=>a.id).filter(Boolean);
  assert.equal(ids.length,new Set(ids).size);
  assert.equal(nodes.filter(n=>n.tagName==='h1').length,1);
  assert.equal(nodes.filter(n=>attrs(n)['data-essay-figure']).length,3);
  assert.equal(nodes.filter(n=>n.tagName==='svg'&&attrs(n).class==='essay-svg').length,6);
  assert.ok(nodes.filter(n=>n.tagName==='math').length>=3);
  assert.ok(!html.includes('<!-- figure:')&&!html.includes('Placeholder'));
  for(const node of nodes) {
    const a=attrs(node);
    for(const label of (a['aria-labelledby']??'').split(' ').filter(Boolean))assert.ok(ids.includes(label),label);
    if(node.tagName==='math')assert.ok(a['aria-label']);
    for(const url of [a.href,a.src].filter(Boolean)) {
      if(url.startsWith('#'))assert.ok(ids.includes(url.slice(1)),url);
      if(url.startsWith('/')&&!url.startsWith('//')){
        const relative=url.slice(1).split('#')[0];
        assert.ok(fs.existsSync(path.join('dist',relative.endsWith('/')?relative+'index.html':relative)),url);
      }
    }
  }
  assert.ok(fs.readFileSync('dist/posts/index.html','utf8').includes(`/posts/${slug}/`));
  assert.ok(fs.readFileSync('dist/index.html','utf8').includes(`/posts/${slug}/`));
}
// Playback exposes saved checkpoints, independent of the exploration condition.
for(const condition of [0,1])for(const episode of [0,1,100,200,300]) {
 const svg=f.renderFigure('shaping_learning',condition,false,false,episode/300);
 assert.ok(svg.includes(`Prefer upper · episode ${episode}`));
 assert.ok(!/NaN|Infinity|undefined/.test(svg));
 assert.ok(f.stageDescription('shaping_learning',condition,episode/300).startsWith(`Episode ${episode}:`));
}
assert.notEqual(f.renderFigure('shaping_identity',.1),f.renderFigure('shaping_identity',.2));
for(const id of ['credit_learning','uncertainty_probe'])for(const condition of [0,.5,1])for(const reveal of [0,.13,.5,1])for(const compact of [false,true]) {
 const svg=f.renderFigure(id,condition,compact,false,reveal);
 assert.ok(!/NaN|Infinity|undefined/.test(svg));
 assert.ok(!/undefined/.test(f.stageDescription(id,condition,reveal)));
 if(reveal<1)assert.notEqual(svg,f.renderFigure(id,condition,compact));
}

console.log('PASS rendered essays: three routes, nine figures/eighteen responsive SVGs, accessible math and labels, complete exports, home/post listings, and local links.');
class Element {
  constructor(){this.dataset={};this.listeners={};this.attributes={};this.hidden=true;this.textContent='';this.innerHTML='';}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
  removeEventListener(name,fn){this.listeners[name]=(this.listeners[name]??[]).filter(x=>x!==fn);}
  setAttribute(name,value){this.attributes[name]=value;}
  fire(name,event={}){for(const fn of this.listeners[name]??[])fn(event);}
}
for(const reduced of [false,true]) {
  const roots=Object.keys(f.figures).map(id=>{
    const root=new Element();root.dataset.essayFigure=id;
    root.slots=Object.fromEntries(['.essay-drawing-wide','.essay-drawing-small','[data-play]','[data-next]','[data-reset]','[data-stage]','[data-position]','.essay-playback'].map(s=>[s,new Element()]));
    root.presets=(f.figures[id].presets??[]).map(p=>{const e=new Element();e.dataset.frame=String(p.progress);return e;});
    root.querySelectorAll=()=>root.presets;
    root.querySelector=s=>root.slots[s];return root;
  });
  const document=new Element();document.hidden=false;document.querySelectorAll=()=>roots;
  const preference=new Element();preference.matches=reduced;
  const window=new Element(),observers=[];
  class IntersectionObserver {constructor(cb){this.cb=cb;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}enter(v){this.cb([{isIntersecting:v}]);}}
  Object.assign(window,{IntersectionObserver,matchMedia:()=>preference});
  let now=0,next=0;const queue=new Map();
  const sandbox={exports:{},require:()=>f,document,window,IntersectionObserver,performance:{now:()=>now},requestAnimationFrame:cb=>{queue.set(++next,cb);return next;},cancelAnimationFrame:id=>queue.delete(id)};
  vm.runInNewContext(compile('motion'),sandbox);sandbox.exports.initEssayFigures();
  const advance=()=>{now+=50;for(const [id,cb] of [...queue]){queue.delete(id);cb(now);}};
  for(let i=0;i<roots.length;i++){
    const root=roots[i],play=root.querySelector('[data-play]');
    const meta=f.figures[root.dataset.essayFigure];
    const timeline=meta.timeline??{label:'Episode',steps:300};
    const complete=meta.comparison?`${timeline.label} ${timeline.steps} / ${timeline.steps}`:'5 / 5';
    assert.equal(root.querySelector('.essay-playback').hidden,false);
    observers[i].enter(true);assert.equal(queue.size,reduced?0:1);
    if(reduced){assert.equal(play.hidden,true);root.querySelector('[data-next]').fire('click');assert.equal(queue.size,0);assert.equal(root.querySelector('[data-position]').textContent,meta.comparison?`${timeline.label} 0 / ${timeline.steps}`:meta.initialProgress===0?'2 / 5':'1 / 5');}
    else{advance();play.fire('click');assert.equal(queue.size,0);}
    root.querySelector('[data-next]').fire('click');assert.equal(queue.size,0);
    root.querySelector('[data-reset]').fire('click');assert.equal(root.querySelector('[data-position]').textContent,complete);
    for(const preset of root.presets){preset.fire('click');assert.equal(queue.size,0);assert.equal(preset.attributes['aria-pressed'],'true');assert.equal(root.querySelector('.essay-drawing-wide').innerHTML,f.renderFigure(root.dataset.essayFigure,Number(preset.dataset.frame)));}
    if(!reduced){
      play.fire('click');const initial=root.querySelector('.essay-drawing-wide').innerHTML;
      for(let n=0;n<50;n++)advance();assert.notEqual(root.querySelector('.essay-drawing-wide').innerHTML,initial);
      observers[i].enter(false);assert.equal(queue.size,0);observers[i].enter(true);assert.equal(queue.size,0);
      play.fire('click');for(let n=0;n<260;n++)advance();assert.equal(queue.size,0);assert.equal(root.querySelector('[data-position]').textContent,complete);
      play.fire('click');document.hidden=true;document.fire('visibilitychange');assert.equal(queue.size,0);document.hidden=false;
    }
  }
  preference.matches=true;preference.fire('change');assert.equal(queue.size,0);
  assert.ok(roots.every(r=>{const meta=f.figures[r.dataset.essayFigure],t=meta.timeline??{label:'Episode',steps:300};return r.querySelector('[data-position]').textContent===(meta.comparison?`${t.label} ${t.steps} / ${t.steps}`:'5 / 5');}));
  window.fire('pagehide',{persisted:false});assert.ok(observers.every(o=>o.disconnected));
  console.log(`PASS simulated playback, reduced motion ${reduced?'on':'off'}: play/pause, stepping, completion, visibility, preferences, cleanup.`);
}
