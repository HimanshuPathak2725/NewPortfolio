import {clamp, lerp, spring, fitDynamics, gaussianUpdate, density, plan, ensemble, GOAL, OBSTACLE} from './experiments';
import type {LabKind} from '../../data/world-models';

// These figures use the same deterministic systems as the article. Rendering is
// pure, so the server, browser, and exported frames share exactly one drawing.
export interface AnimationFrame { markup:string; width:number; height:number; phase:string }
const ease=(x:number)=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
const f=(x:number)=>Number(x.toFixed(3));
const text=(x:number,y:number,value:string,cls='note',anchor='start')=>`<text x="${f(x)}" y="${f(y)}" class="${cls}" text-anchor="${anchor}">${value}</text>`;
const path=(points:number[][],cls:string,extra='')=>`<path d="${points.map(([x,y],i)=>`${i?'L':'M'}${f(x)},${f(y)}`).join(' ')}" class="${cls}" ${extra}/>`;
const circle=(x:number,y:number,r:number,cls:string,extra='')=>`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" class="${cls}" ${extra}/>`;
const line=(x:number,y:number,xx:number,yy:number,cls='hairline',extra='')=>path([[x,y],[xx,yy]],cls,extra);
const group=(x:number,y:number,body:string)=>`<g transform="translate(${f(x)} ${f(y)})">${body}</g>`;
const reveal=(amount:number)=>`pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f(1-clamp(amount,0,1))}"`;
const at=(points:{x:number}[],t:number)=>{const n=clamp(t,0,1)*(points.length-1),i=Math.min(Math.floor(n),points.length-2);return lerp(points[i].x,points[i+1].x,n-i);};
const prefix=(kind:LabKind)=>`wm-motion-${kind}`;
const fitted=fitDynamics().history.at(-1)!;
const springs={truth:spring({x:.8,v:0},.8,.15),before:spring({x:.8,v:0},.15,.02),after:spring({x:.8,v:0},fitted.stiffness,fitted.damping)};
let plans:ReturnType<typeof plan>[]|undefined;
let fans:ReturnType<typeof ensemble>[]|undefined;
const getPlans=()=>plans??=( [plan(28,true,14),plan(28,false,14)] );
const getFans=()=>fans??=( [ensemble(.16),ensemble(.16,120,8)] );
function pair(compact:boolean,render:(width:number,index:number)=>string,panelHeight:number){
 const width=compact?440:800,panelWidth=compact?400:364;
 return {width,height:compact?panelHeight*2+80:panelHeight+70,
 markup:[0,1].map(i=>group(compact?20:20+i*396,compact?25+i*(panelHeight+28):25,render(panelWidth,i))).join('')};
}
function coil(left:number,right:number,y:number){
 const pts=[[left,y],[left+8,y]];
 for(let i=0;i<=24;i++)pts.push([lerp(left+8,right-12,i/24),y+(i===0||i===24?0:i%2?7:-7)]);
 pts.push([right,y]);return path(pts,'coil');
}
function belief(t:number,compact:boolean):AnimationFrame {
 const width=compact?440:800,height=430,cx=width/2,travel=(width-120)*.38;
 const future=ease((t-.16)/.48),history=ease((t-.7)/.14),p=prefix('belief');
 let body=text(cx,30,'One observed position','note','middle');
 body+=line(45,104,width-45,104);
 body+=circle(cx,104,21,'halo')+circle(cx,104,9,'body-ink');
 body+=`<g opacity="${f(history)}">${circle(cx-50,104,7,'outline-blue')}${line(cx-40,104,cx-18,104,'stroke-blue',`marker-end="url(#${p}-arrow)"`)}${text(cx-50,75,'earlier','note','middle')}</g>`;
 body+=text(cx,143,'x = 0.5','formula','middle');
 body+=`<g opacity="${f(ease(t/.12))}">${path([[cx,160],[cx,178],[cx,202]],'hairline')}${text(36,220,'v = +0.16','formula-blue')}${text(36,320,'v = −0.16',history>.5?'note':'formula-orange')}</g>`;
 [1,-1].forEach((sign,index)=>{
  const y=240+index*100,color=index?'orange':'blue',end=cx+sign*travel*future,alpha=index?1-history*.83:1;
  body+=`<g opacity="${f(alpha)}">${line(40,y,width-40,y)}${circle(cx,y,5,'outline-ink')}`;
  for(let j=1;j<=5;j++)body+=circle(cx+sign*travel*future*j/6,y,2+1.5*j/6,`body-${color}`,`opacity="${f(.08+j*.04)}"`);
  body+=line(cx,y,end,y,`stroke-${color}`)+circle(end,y,18,`halo-${color}`)+circle(end,y,8,`body-${color}`)+`</g>`;
 });
 body+=text(cx,397,history>.5?'v ≈ (0.50 − 0.42) / 0.5 = +0.16':'Same position; opposite hidden velocities.',history>.5?'formula-small':'note','middle');
 return {markup:body,width,height,phase:history>.5?'The previous observation identifies the direction.':future>.1?'Two hidden velocities produce different futures.':'Position alone leaves velocity unknown.'};
}
function learning(t:number,compact:boolean):AnimationFrame {
 const motion=ease(t/.87);
 const result=pair(compact,(w,index)=>{
  const model=index?springs.after:springs.before,color=index?'green':'orange';
  const x=(value:number)=>55+(value+1)/2*(w-80),mx=x(at(model,motion)),tx=x(at(springs.truth,motion));
  let body=text(0,0,index?'After fitting':'Before fitting','panel-title');
  body+=text(0,27,index?`k = ${f(fitted.stiffness)} · c = ${f(fitted.damping)}`:'k = 0.15 · c = 0.02','note');
  body+=line(18,131,w-8,131)+line(22,58,22,131,'wall');
  body+=`<g class="spring-${color}">${coil(22,mx-14,98)}<rect x="${f(mx-14)}" y="83" width="28" height="30" rx="3" class="body-${color}"/>${circle(mx,119,3,'body-ink')}</g>`;
  body+=`<rect x="${f(tx-14)}" y="83" width="28" height="30" rx="3" class="reference-mass"/>`;
  if(Math.abs(tx-mx)>9){body+=line(mx,140,tx,140,'error-link')+line(mx,136,mx,144,'error-link')+line(tx,136,tx,144,'error-link');}
  body+=text(w-10,164,`position error ${Math.abs(at(model,motion)-at(springs.truth,motion)).toFixed(3)}`,'note','end');
  const px=(time:number)=>14+time/6*(w-28),py=(value:number)=>214-value*47;
  body+=line(14,214,w-14,214)+line(14,272,w-14,272);
  body+=path(springs.truth.map(p=>[px(p.t),py(p.x)]),'reference-path');
  const points=model.filter(p=>p.t<=motion*6).map(p=>[px(p.t),py(p.x)]);points.push([px(motion*6),py(at(model,motion))]);
  body+=path(points,`stroke-${color}`)+circle(px(motion*6),py(at(model,motion)),5,`body-${color}`);
  body+=text(14,297,'0','note')+text(w-14,297,'6 s','note','end');
  body+=text(0,331,'— prediction     ··· true motion','note');
  return body;
 },346);
 return {...result,phase:`The same initial state, ${f(motion*6).toFixed(1)} seconds into both rollouts.`};
}
function posterior(t:number,compact:boolean):AnimationFrame {
 const width=compact?440:800,height=410,left=compact?36:62,right=width-(compact?25:45),top=88,bottom=305;
 const x=(v:number)=>left+(v+1.5)/3*(right-left),y=(v:number)=>bottom-v/2.2*(bottom-top);
 const post=gaussianUpdate(.6,.25),xs=Array.from({length:161},(_,i)=>-1.5+3*i/160);
 const evidence=ease((t-.25)/.2),correction=ease((t-.55)/.28),p=prefix('posterior');
 const prior=xs.map(v=>[x(v),y(density(v,0,.5))]),likelihood=xs.map(v=>[x(v),y(density(v,.6,.25))]),updated=xs.map(v=>[x(v),y(density(v,post.mean,post.sigma))]);
 let body=text(left,27,'Prior','formula-blue')+text(width/2,27,'Observation','formula-orange','middle')+text(right,27,'Posterior','formula-green','end');
 body+=text(left,58,'Probability density','note');
 body+=line(left,bottom,right,bottom);
 for(const tick of [-1,0,1])body+=line(x(tick),bottom,x(tick),bottom+5)+text(x(tick),bottom+25,String(tick),'note','middle');
 body+=path(prior,'stroke-blue',reveal(ease(t/.22)));
 body+=path(likelihood,'likelihood',`opacity="${f(evidence*.8)}"`);
 const peak=y(density(post.mean,post.mean,post.sigma));
 body+=`<g opacity="${f(correction)}">${path([...updated,[x(1.5),bottom],[x(-1.5),bottom]],'density-fill')}${path(updated,'stroke-green')}${line(x(post.mean),peak,x(post.mean),bottom,'mean-line')}${circle(x(post.mean),peak,5,'body-green')}${path([[x(post.mean)-5,peak-5],[x(post.mean)-25,peak-24],[x(post.mean)-70,peak-24]],'mean-line')}${text(x(post.mean)-27,peak-31,'μ′ = 0.48','note-green','end')}</g>`;
 body+=`<g opacity="${f(evidence)}">${line(x(.6),bottom+48,x(post.mean),bottom+48,'stroke-orange',`marker-end="url(#${p}-arrow)"`)}${text(width/2,391,'μ = 0   →   μ′ = 0.48','formula','middle')}</g>`;
 return {markup:body,width,height,phase:correction>.5?'The posterior combines the prior and measurement likelihood.':evidence>.1?'New evidence: position 0.6, measurement σ = 0.25.':'A prior with mean 0 and standard deviation 0.5.'};
}
function planning(t:number,compact:boolean):AnimationFrame {
 const progress=clamp((t-.5)/.4,0,1),pass=Math.min(5,Math.floor(t/.5*6));
 const result=pair(compact,(w,index)=>{
  const solution=getPlans()[index],iteration=solution.passes[pass],size=w-26,ox=13,oy=65,id=`${prefix('planning')}-${index}`;
  const point=(s:{x:number;y:number})=>[ox+s.x*size,oy+s.y*size];
  const route=(states:{x:number;y:number}[])=>states.map(point);
  const [gx,gy]=point(GOAL),[bx,by]=point(OBSTACLE);
  let body=text(0,0,index?'Obstacle omitted':'Obstacle included','panel-title');
  body+=text(0,27,t<.5?`Sampling actions · pass ${pass+1} of 6`:'Executing the selected actions','note');
  body+=`<defs><clipPath id="${id}-clip"><rect x="${ox}" y="${oy}" width="${size}" height="${size}"/></clipPath><pattern id="${id}-hatch" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7 L7 0" class="hatch"/></pattern></defs>`;
  body+=`<g clip-path="url(#${id}-clip)">`;
  // A sparse floor of points supplies spatial context without enclosing a panel.
  for(let xx=0;xx<=10;xx++)for(let yy=0;yy<=10;yy++)body+=circle(ox+xx/10*size,oy+yy/10*size,.65,'floor-dot');
  body+=circle(bx,by,OBSTACLE.radius*size,index?'obstacle-unknown':'obstacle')+circle(bx,by,OBSTACLE.radius*size,'obstacle-hatch',`fill="url(#${id}-hatch)"`);
  iteration.candidates.filter((_,i)=>i%4===0).forEach(candidate=>{body+=path(route(candidate.states),'candidate',`opacity="${t<.5?.15:.04}"`);});
  if(t<.5){
   const sweep=(t/.5*6)%1,n=sweep*28,i=Math.min(27,Math.floor(n)),fraction=n-i,states=iteration.best.states;
   const preview={x:lerp(states[i].x,states[i+1].x,fraction),y:lerp(states[i].y,states[i+1].y,fraction)};
   const [sx,sy]=point(preview);
   body+=path(route(states),'search-route',reveal(sweep))+circle(sx,sy,5,'body-green');
  }else body+=path(route(iteration.best.states),'planned-route');
  body+=circle(gx,gy,11,'goal-ring')+circle(gx,gy,4,'body-green');
  const n=progress*28,i=Math.min(27,Math.floor(n)),fraction=n-i;
  const actual=solution.actual.states,predicted=solution.best.states;
  const current={x:lerp(actual[i].x,actual[i+1].x,fraction),y:lerp(actual[i].y,actual[i+1].y,fraction)};
  const imagined={x:lerp(predicted[i].x,predicted[i+1].x,fraction),y:lerp(predicted[i].y,predicted[i+1].y,fraction)};
  const [ax,ay]=point(current),[px,py]=point(imagined);
  if(t>=.5){body+=path(route([...actual.slice(0,i+1),current]),'actual-route');body+=line(ax,ay,px,py,'error-link')+circle(px,py,5,'outline-green');}
  if(index&&t>.9)body+=text((ax+px)/2,(ay+py)/2-12,'prediction gap','note-orange','middle');
  body+=circle(ax,ay,15,'halo')+circle(ax,ay,7,'body-ink');
  body+='</g>'+text(gx,gy-19,'goal','note','middle');
  body+=text(w/2,oy+size+28,index&&t>.9?'Prediction and execution separate.':'Same starting state. Same action budget.','note','middle');
  return body;
 },compact?480:444);
 return {...result,phase:t<.5?'Six passes narrow the sampled action sequences.':t<.9?'The chosen plans run against the same physical obstacle.':'The missing constraint becomes an error in the executed path.'};
}
function uncertainty(t:number,compact:boolean):AnimationFrame {
 const time=clamp(t/.88,0,1)*6,index=Math.floor(time/.05);
 const result=pair(compact,(w,k)=>{
  const fan=getFans()[k],x=(tt:number)=>12+tt/6*(w-24),y=(value:number)=>162-value*91;
  let body=text(0,0,k?'With fresh observations':'Without fresh observations','panel-title');
  body+=text(0,27,k?'State corrected every 0.4 seconds':'Thirteen models, slightly different stiffness','note');
  body+=line(12,162,w-12,162)+line(12,278,w-12,278);
  body+=path(fan.truth.map(p=>[x(p.t),y(p.x)]),'reference-path');
  const upper=fan.truth.slice(0,index+1).map((p,i)=>[x(p.t),y(Math.max(...fan.models.map(m=>m[i].x)))]);
  const lower=fan.truth.slice(0,index+1).map((p,i)=>[x(p.t),y(Math.min(...fan.models.map(m=>m[i].x)))]).reverse();
  if(upper.length)body+=path([...upper,...lower],'fan-fill');
  if(k)for(let i=8;i<=index;i+=8){body+=line(x(i*.05),63,x(i*.05),263,'observation-line');}
  fan.models.forEach(model=>{body+=path(model.slice(0,index+1).map(p=>[x(p.t),y(p.x)]),'ensemble-path');body+=circle(x(index*.05),y(model[index].x),2,'body-blue');});
  body+=path(fan.truth.slice(0,index+1).map(p=>[x(p.t),y(p.x)]),'actual-route')+circle(x(index*.05),y(fan.truth[index].x),5,'body-ink');
  body+=text(12,304,'0','note')+text(w-12,304,'6 s','note','end');
  return body;
 },324);
 return {...result,phase:`${time.toFixed(1)} seconds. New observations correct state; the dynamics assumptions remain unchanged.`};
}
const renderers={belief,learning,posterior,planning,uncertainty};
export function renderAnimationFrame(kind:LabKind,progress:number,compact=false):AnimationFrame {
 const frame=renderers[kind](clamp(progress,0,1),compact),id=prefix(kind);
 return {...frame,markup:`<defs><marker id="${id}-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8" fill="currentColor"/></marker></defs>${frame.markup}`};
}
export const animationNotes:Record<LabKind,{caption:string;description:string;duration:number}>={
 belief:{duration:10,caption:'One position admits two velocities. An earlier observation resolves the ambiguity in this noise-free example.',description:'Two particles share the same observed position and move in opposite directions. Revealing an earlier observation rules out one direction.'},
 learning:{duration:12,caption:'The same six-second spring rollout before and after fitting stiffness and damping. The outlined block and dotted curve show the true system; color shows the prediction.',description:'Two animated spring systems compare predictions before and after fitting two dynamics parameters using 96 synthetic measurements.'},
 posterior:{duration:10,caption:'A Gaussian prior, a measurement likelihood, and their resulting posterior. The curves appear in sequence; this is one analytic update, not a succession of updates.',description:'The prior distribution appears first, then an observation likelihood centered at 0.6, then the posterior centered at 0.48.'},
 planning:{duration:14,caption:'Two optimizers use the same seed and budget. Green traces show predicted paths; dark traces show execution. The right model omits the obstacle, but the environment still enforces collisions.',description:'Side-by-side particle plans show sampled paths refining over six passes, then execution. The plan that omits the obstacle diverges from its predicted path.'},
 uncertainty:{duration:12,caption:'The same thirteen spring models roll forward with and without exact state observations every eight steps. Blue spread shows their range, not a calibrated confidence interval.',description:'Two animated fans of spring trajectories compare uncorrected prediction drift with state correction every 0.4 seconds. The dark line shows the true system.'},
};
