import {clamp,lerp,fitDynamics,gaussianUpdate,density,plan,ensemble,spring,REAL_DYNAMICS,GOAL,OBSTACLE,type Point2} from './experiments';
import {labViews} from '../../data/world-models';

type Kind = 'belief'|'learning'|'posterior'|'planning'|'uncertainty';
type Color = {ink:string;muted:string;line:string;blue:string;green:string;orange:string;paper:string};
type Plot = {left:number;top:number;width:number;height:number;x:(value:number)=>number;y:(value:number)=>number};
const format = (value:number,digits=3) => value.toFixed(digits);
function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color:string,size=12,align:CanvasTextAlign='left') {
 ctx.fillStyle=color;ctx.font=`${size}px "Inter Variable", system-ui, sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.textAlign='left';
}
function line(ctx:CanvasRenderingContext2D,points:[number,number][],color:string,width=2,dashed=false,alpha=1) {
 if(!points.length)return;ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(dashed?[5,4]:[]);
 points.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore();
}
function dot(ctx:CanvasRenderingContext2D,x:number,y:number,color:string,radius=5,ring=false) {
 ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);if(ring){ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();}else{ctx.fillStyle=color;ctx.fill();}
}
function plot(ctx:CanvasRenderingContext2D,left:number,top:number,width:number,height:number,xRange:[number,number],yRange:[number,number],colors:Color,xLabel:string,yLabel:string):Plot {
 const x=(value:number)=>left+(value-xRange[0])/(xRange[1]-xRange[0])*width;
 const y=(value:number)=>top+height-(value-yRange[0])/(yRange[1]-yRange[0])*height;
 ctx.strokeStyle=colors.line;ctx.lineWidth=0.6;
 for(let index=0;index<=4;index++){
  const xx=left+width*index/4,yy=top+height*index/4;
  ctx.beginPath();ctx.moveTo(xx,top);ctx.lineTo(xx,top+height);ctx.moveTo(left,yy);ctx.lineTo(left+width,yy);ctx.stroke();
  label(ctx,format(lerp(xRange[0],xRange[1],index/4),xRange[1]>20?0:xRange[1]<=3?2:1),xx,top+height+20,colors.muted,10,'center');
  label(ctx,format(lerp(yRange[1],yRange[0],index/4),2),left-8,yy+3,colors.muted,10,'right');
 }
 label(ctx,yLabel,left,top-15,colors.muted,11);label(ctx,xLabel,left+width,top+height+41,colors.muted,11,'right');
 return {left,top,width,height,x,y};
}
function legend(ctx:CanvasRenderingContext2D,items:[string,string][],y:number,w:number) {
 const start=w<460?42:54;let x=start,row=0;
 const positions=items.map(([name,color])=>{const width=name.length*5.5+42;if(x>start&&x+width>w-12){x=start;row++;}const position={name,color,x,row};x+=width;return position;});
 positions.forEach(item=>{const yy=y-(row-item.row)*18;line(ctx,[[item.x,yy-4],[item.x+16,yy-4]],item.color,2.5);label(ctx,item.name,item.x+23,yy,item.color,10.5);});
}
function cursor(ctx:CanvasRenderingContext2D,p:Plot,value:number,color:string) {
 line(ctx,[[p.x(value),p.top],[p.x(value),p.top+p.height]],color,1,true,.35);
}
function springScene(ctx:CanvasRenderingContext2D,x:number,y:number,left:number,right:number,color:string,title:string) {
 line(ctx,[[left,y+13],[right,y+13]],color,.7,false,.2);
 line(ctx,[[left,y-12],[left,y+12]],color,2);
 const end=x-10,points:[number,number][]=[[left,y],[left+7,y]];
 for(let i=0;i<=16;i++)points.push([lerp(left+7,end,i/16),y+(i===0||i===16?0:i%2?5:-5)]);
 line(ctx,points,color,1.4);ctx.fillStyle=color;ctx.fillRect(x-9,y-9,18,18);
 label(ctx,title,right,y-15,color,10,'right');
}
function values(root:HTMLElement,items:[string,string][]) {
 const readouts=root.querySelector<HTMLDListElement>('.wm-readouts')!;
 if(readouts.children.length!==items.length){readouts.replaceChildren(...items.map(([name])=>{
  const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;div.append(dt,dd);return div;
 }));}
 items.forEach(([name,value],index)=>{const item=readouts.children[index];const dt=item.querySelector('dt')!,dd=item.querySelector('dd')!;if(dt.textContent!==name)dt.textContent=name;if(dd.textContent!==value)dd.textContent=value;});
}

function attach(root:HTMLElement) {
 const kind=root.dataset.scientificLab as Kind;
 const canvas=root.querySelector<HTMLCanvasElement>('canvas')!,ctx=canvas.getContext('2d');if(!ctx)return;
 const ui=root.querySelector<HTMLElement>('.wm-lab-ui')!,fallback=root.querySelector<HTMLImageElement>('.wm-lab-fallback')!;
 const timeline=root.querySelector<HTMLInputElement>('[data-timeline]')!,play=root.querySelector<HTMLButtonElement>('[data-play]')!,stepButton=root.querySelector<HTMLButtonElement>('[data-step]')!,reset=root.querySelector<HTMLButtonElement>('[data-reset]')!;
 const status=root.querySelector<HTMLOutputElement>('[data-status]')!,time=root.querySelector<HTMLOutputElement>('[data-time]')!,hint=root.querySelector<HTMLElement>('.wm-motion-hint')!;
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 const initialPlay=play.textContent?.trim()??'Play experiment';
 let progress=0,playing=false,frame=0,lastTime=0,visible=true,w=0,h=0;
 let training=fitDynamics(),solution=plan(),fan=ensemble();
 const parameter=(name:string)=>Number(root.querySelector<HTMLInputElement>(`[data-parameter="${name}"]`)?.value??0);
 const enabled=(name:string)=>root.querySelector<HTMLInputElement>(`[data-toggle="${name}"]`)?.checked??false;
 const colors=():Color=>{const styles=getComputedStyle(root);return {ink:styles.getPropertyValue('--wm-ink').trim(),muted:styles.getPropertyValue('--wm-muted').trim(),line:styles.getPropertyValue('--wm-line').trim(),blue:styles.getPropertyValue('--wm-blue').trim(),green:styles.getPropertyValue('--wm-green').trim(),orange:styles.getPropertyValue('--wm-orange').trim(),paper:styles.getPropertyValue('--wm-surface').trim()};};
 function resize(){const bounds=canvas.getBoundingClientRect();w=bounds.width;h=bounds.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx!.setTransform(dpr,0,0,dpr,0,0);draw();}
 function recompute(){
  root.querySelectorAll<HTMLInputElement>('[data-parameter]').forEach(input=>{const output=root.querySelector<HTMLOutputElement>(`[data-knob-output="${input.dataset.parameter}"]`);if(output)output.textContent=`${input.value} ${input.dataset.unit}`;});
  if(kind==='learning')training=fitDynamics(parameter('samples'),parameter('noise'));
  if(kind==='planning')solution=plan(parameter('horizon'),enabled('obstacle'),parameter('seed'));
  if(kind==='uncertainty')fan=ensemble(parameter('spread'),120,enabled('correction')?8:0);
 }
 function draw(){
  if(!w||!h)return;const c=colors();ctx!.clearRect(0,0,w,h);ctx!.fillStyle=c.paper;ctx!.fillRect(0,0,w,h);
  if(kind==='belief'){
   const speed=parameter('speed'),known=enabled('history'),t=progress*2.5;
   const currentA=.5+speed*t,currentB=.5-speed*t;
   const sx=(x:number)=>44+(x+.4)/1.8*(w-72);
   label(ctx!,known?'HISTORY REVEALS MOTION':'ONE FRAME, TWO VELOCITIES',44,30,c.muted,10.5);
   line(ctx!,[[44,82],[w-28,82]],c.line,1.5);dot(ctx!,sx(.5),82,c.ink,5,true);
   line(ctx!,[[sx(.5),82],[sx(currentA),82]],c.blue,2);dot(ctx!,sx(currentA),82,c.blue,8);
   line(ctx!,[[sx(.5),92],[sx(currentB),92]],known?c.line:c.orange,2,true);dot(ctx!,sx(currentB),92,known?c.line:c.orange,7);
   if(known){dot(ctx!,sx(.5-speed*.5),82,c.blue,4,true);label(ctx!,'previous frame',sx(.5-speed*.5),62,c.blue,10,'center');}
   const p=plot(ctx!,44,155,w-72,h-220,[0,2.5],[-.4,1.4],c,'imagined time (seconds)','predicted position');
   const pts=Array.from({length:81},(_,i)=>i/80*2.5);
   line(ctx!,pts.map(tt=>[p.x(tt),p.y(.5+speed*tt)]),c.blue,2,false,.18);
   line(ctx!,pts.map(tt=>[p.x(tt),p.y(.5-speed*tt)]),known?c.line:c.orange,2,true,.18);
   line(ctx!,pts.filter(tt=>tt<=t).map(tt=>[p.x(tt),p.y(.5+speed*tt)]),c.blue,2.5);
   line(ctx!,pts.filter(tt=>tt<=t).map(tt=>[p.x(tt),p.y(.5-speed*tt)]),known?c.line:c.orange,2.5,true);
   dot(ctx!,p.x(t),p.y(currentA),c.blue);dot(ctx!,p.x(t),p.y(currentB),known?c.line:c.orange);
   legend(ctx!,[['velocity +'+format(speed,2),c.blue],[known?'inconsistent with history':'velocity −'+format(speed,2),known?c.muted:c.orange]],h-14,w);
   values(root,[['Observed position','0.50'],['Compatible velocity',known?'+'+format(speed,2):'±'+format(speed,2)],['Consistent futures',known?'1':'2']]);
   status.dataset.summary=known?'The earlier position resolves the sign of velocity. The faded branch is inconsistent with that history.':'Both velocity hypotheses agree with the same current observation. The future is ambiguous.';
  }else if(kind==='learning'){
   const epoch=Math.round(progress*120),fit=training.history[epoch];
   const trueAt=spring({x:.8,v:0},REAL_DYNAMICS.stiffness,REAL_DYNAMICS.damping,60).at(-1)!;
   const modelAt=spring({x:.8,v:0},fit.stiffness,fit.damping,60).at(-1)!;
   const x=(value:number)=>76+(value+1)/2*(w-112);
   label(ctx!,'POSITION AFTER 3 SECONDS',44,24,c.muted,10.5);
   springScene(ctx!,x(trueAt.x),65,44,w-28,c.blue,'true system');
   springScene(ctx!,x(modelAt.x),115,44,w-28,c.orange,'fitted model');
   const maximum=Math.max(...training.history.flatMap(point=>[point.trainLoss,point.testLoss]))*1.16;
   const p=plot(ctx!,44,159,w-72,h-226,[0,120],[0,maximum],c,'gradient descent epoch','mean squared error');
   cursor(ctx!,p,epoch,c.ink);
   for(const [key,color,dashed] of [['trainLoss',c.green,false],['testLoss',c.blue,true]] as const){
    line(ctx!,training.history.map(point=>[p.x(point.epoch),p.y(point[key])]),color,1.5,dashed,.16);
    line(ctx!,training.history.slice(0,epoch+1).map(point=>[p.x(point.epoch),p.y(point[key])]),color,2.6,dashed);
    dot(ctx!,p.x(epoch),p.y(fit[key]),color,4);
   }
   legend(ctx!,[['training loss',c.green],['held-out test loss',c.blue]],h-15,w);
   values(root,[['Learned stiffness',format(fit.stiffness)],['Learned damping',format(fit.damping)],['Test MSE',format(fit.testLoss,5)]]);
   status.dataset.summary=`Epoch ${epoch}/120. Ground-truth stiffness 0.800 and damping 0.150. Training MSE ${format(fit.trainLoss,5)}; held-out MSE ${format(fit.testLoss,5)}.`;
  }else if(kind==='posterior'){
   const observed=parameter('observation'),sigma=parameter('sigma'),post=gaussianUpdate(observed,sigma);
   // Stable across playback and measurement presets: only the distribution moves.
   const mean=lerp(0,post.mean,progress),spread=lerp(.5,post.sigma,progress),maximum=8.5;
   const p=plot(ctx!,44,74,w-72,h-146,[-1.5,1.5],[0,maximum],c,'latent position','probability density');
   const xs=Array.from({length:201},(_,i)=>-1.5+i/200*3);
   const area=xs.map(x=>[p.x(x),p.y(density(x,mean,spread))] as [number,number]);
   ctx!.save();ctx!.fillStyle=c.green;ctx!.globalAlpha=.09;ctx!.beginPath();ctx!.moveTo(p.x(-1.5),p.y(0));area.forEach(([x,y])=>ctx!.lineTo(x,y));ctx!.lineTo(p.x(1.5),p.y(0));ctx!.closePath();ctx!.fill();ctx!.restore();
   line(ctx!,xs.map(x=>[p.x(x),p.y(density(x,0,.5))]),c.blue,2,true,.5);
   line(ctx!,area,c.green,3);line(ctx!,[[p.x(observed),p.top],[p.x(observed),p.top+p.height]],c.orange,1.4,true);
   dot(ctx!,p.x(mean),p.y(density(mean,mean,spread)),c.green,5);
   label(ctx!,progress===1?'POSTERIOR':'PRIOR → POSTERIOR',44,31,c.muted,10.5);
   legend(ctx!,[['prior',c.blue],['belief',c.green],['observation',c.orange]],h-20,w);
   values(root,[['Posterior mean',format(post.mean)],['Posterior σ',format(post.sigma)],['Observation weight',format(post.gain*100,1)+'%']]);
   status.dataset.summary=`Analytic posterior mean ${format(post.mean)}, σ ${format(post.sigma)}. The animation morphs between the two distributions for illustration; its intermediate frames are not successive Bayesian updates.`;
  }else if(kind==='planning'){
   const horizon=parameter('horizon'),pass=progress<.65?clamp(Math.floor(progress/.65*6),0,5):5;
   const iteration=solution.passes[pass];
   const size=Math.min(w-76,h-104),left=(w-size)/2,top=48;
   const p=plot(ctx!,left,top,size,size,[0,1],[0,1],c,'horizontal position','height (1 − y)');
   const mapped=(states:Point2[])=>states.map(state=>[p.x(state.x),p.y(1-state.y)] as [number,number]);
   ctx!.save();ctx!.beginPath();ctx!.rect(left,top,size,size);ctx!.clip();
   ctx!.fillStyle=c.orange;ctx!.globalAlpha=.12;ctx!.beginPath();ctx!.arc(p.x(OBSTACLE.x),p.y(1-OBSTACLE.y),OBSTACLE.radius*size,0,Math.PI*2);ctx!.fill();ctx!.globalAlpha=1;
   iteration.candidates.slice(12).forEach(candidate=>line(ctx!,mapped(candidate.states),c.blue,.8,false,.065));
   iteration.candidates.slice(0,12).forEach(candidate=>line(ctx!,mapped(candidate.states),c.green,1.1,false,.2));
   line(ctx!,mapped(iteration.best.states),c.green,2.8);
   dot(ctx!,p.x(OBSTACLE.x),p.y(1-OBSTACLE.y),c.orange,OBSTACLE.radius*size,true);
   label(ctx!,'obstacle',p.x(OBSTACLE.x),p.y(1-OBSTACLE.y)+3,c.orange,10,'center');
   dot(ctx!,p.x(GOAL.x),p.y(1-GOAL.y),c.green,9,true);dot(ctx!,p.x(GOAL.x),p.y(1-GOAL.y),c.green,3);
   label(ctx!,'goal',p.x(GOAL.x),p.y(1-GOAL.y)-16,c.green,10,'center');
   const simulation=progress<.65?trajectoryPoint(iteration.best.states,((progress/.65*6)%1)):null;
   if(simulation)dot(ctx!,p.x(simulation.x),p.y(1-simulation.y),c.green,5);
   const execution=progress>.65?(progress-.65)/.35:0;
   const executed=solution.actual.states.slice(0,Math.max(1,Math.floor(execution*horizon)+1));
   if(execution>0)line(ctx!,mapped(executed),c.ink,2.2,true);
   const agent=trajectoryPoint(solution.actual.states,execution);
   if(execution>0){const predicted=trajectoryPoint(solution.best.states,execution);line(ctx!,[[p.x(predicted.x),p.y(1-predicted.y)],[p.x(agent.x),p.y(1-agent.y)]],c.orange,1.2,true);dot(ctx!,p.x(predicted.x),p.y(1-predicted.y),c.green,5,true);}
   dot(ctx!,p.x(agent.x),p.y(1-agent.y),c.ink,6);
   ctx!.restore();
   label(ctx!,progress<.65?`OPTIMIZATION PASS ${pass+1} / 6`:'EXECUTING THE PLAN',44,24,c.muted,10.5);
   legend(ctx!,[['candidates',c.blue],['prediction',c.green],['execution',c.ink]],h-15,w);
   values(root,[['Optimization pass',`${pass+1} / 6`],['Predicted cost',format(iteration.best.cost,2)],['Full-rollout collision',progress>.65?(solution.actual.collided?'yes':'no'):'not executed']]);
   status.dataset.summary=`Pass ${pass+1}: best predicted cost ${format(iteration.best.cost,2)}. The full selected sequence ${solution.actual.collided?'collides':'does not collide'} when executed under the real obstacle rules. Goal distance after execution: ${format(Math.hypot(solution.actual.states.at(-1)!.x-GOAL.x,solution.actual.states.at(-1)!.y-GOAL.y),3)}.`;
  }else{
   const index=Math.round(progress*120),t=index*.05;
   const p=plot(ctx!,44,65,w-72,h-143,[0,6],[-1,1],c,'rollout time (seconds)','predicted position');
   cursor(ctx!,p,t,c.ink);
   const upper=fan.truth.slice(0,index+1).map((point,i)=>[p.x(point.t),p.y(Math.max(...fan.models.map(model=>model[i].x)))] as [number,number]);
   const lower=fan.truth.slice(0,index+1).map((point,i)=>[p.x(point.t),p.y(Math.min(...fan.models.map(model=>model[i].x)))] as [number,number]).reverse();
   ctx!.save();ctx!.fillStyle=c.blue;ctx!.globalAlpha=.12;ctx!.beginPath();[...upper,...lower].forEach(([x,y],i)=>i?ctx!.lineTo(x,y):ctx!.moveTo(x,y));ctx!.closePath();ctx!.fill();ctx!.restore();
   if(enabled('correction'))for(let i=8;i<=index;i+=8)line(ctx!,[[p.x(i*.05),p.top],[p.x(i*.05),p.top+p.height]],c.green,.8,true,.35);
   for(const model of fan.models){line(ctx!,model.slice(0,index+1).map(point=>[p.x(point.t),p.y(point.x)]),c.blue,1,false,.27);dot(ctx!,p.x(t),p.y(model[index].x),c.blue,2.8);}
   line(ctx!,fan.truth.slice(0,index+1).map(point=>[p.x(point.t),p.y(point.x)]),c.ink,2.6);dot(ctx!,p.x(t),p.y(fan.truth[index].x),c.ink,5);
   const xs=fan.models.map(model=>model[index].x),mean=xs.reduce((sum,x)=>sum+x,0)/xs.length;
   legend(ctx!,[['true system',c.ink],['13 model assumptions',c.blue]],h-23,w);
   values(root,[['Horizon',format(t,2)+' s'],['Ensemble spread',format(Math.max(...xs)-Math.min(...xs))],['Mean prediction error',format(Math.abs(mean-fan.truth[index].x))]]);
   status.dataset.summary=`At ${format(t,2)} seconds, model spread is ${format(Math.max(...xs)-Math.min(...xs))} and ensemble-mean error is ${format(Math.abs(mean-fan.truth[index].x))}. This spread is not a calibrated confidence interval.`;
  }
  const stages=labViews[kind].stages;
  const currentStage=stages.filter(stage=>stage.at<=progress+1e-8).at(-1)!;
  root.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.stage)===currentStage.at)));
  timeline.value=String(progress);timeline.setAttribute('aria-valuetext',`${currentStage.label}, ${Math.round(progress*100)} percent`);time.textContent=`${Math.round(progress*100)}%`;stepButton.disabled=progress>=1;
 }
 function pause(announce=true){playing=false;cancelAnimationFrame(frame);frame=0;play.textContent=initialPlay;play.setAttribute('aria-pressed','false');if(announce)status.textContent=status.dataset.summary??'';}
 function tick(now:number){
  if(!playing)return;const delta=Math.min((now-lastTime)/1000,.1);lastTime=now;progress=Math.min(1,progress+delta/(kind==='planning'?11:8));draw();if(progress>=1)pause();else frame=requestAnimationFrame(tick);
 }
 play.addEventListener('click',()=>{if(playing){pause();return;}if(preference.matches)return;if(progress>=1)progress=0;playing=true;play.textContent='Pause';play.setAttribute('aria-pressed','true');lastTime=performance.now();status.textContent='Playing. Pause or scrub the timeline to inspect a state.';frame=requestAnimationFrame(tick);});
 stepButton.addEventListener('click',()=>{pause(false);progress=Math.min(1,progress+.05);draw();status.textContent=status.dataset.summary??'';});
 reset.addEventListener('click',()=>{pause(false);progress=0;draw();status.textContent=status.dataset.summary??'';});
 timeline.addEventListener('input',()=>{pause(false);progress=Number(timeline.value);draw();status.textContent=status.dataset.summary??'';});
 const presets=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-preset]'));
 function syncPresets(){presets.forEach(button=>{const preset=labViews[kind].presets[Number(button.dataset.preset)];const matches=Object.entries(preset.parameters).every(([name,value])=>parameter(name)===value)&&Object.entries(preset.toggles).every(([name,value])=>enabled(name)===value);button.setAttribute('aria-pressed',String(matches));});}
 presets.forEach(button=>button.addEventListener('click',()=>{
  pause(false);const preset=labViews[kind].presets[Number(button.dataset.preset)];
  for(const [name,value] of Object.entries(preset.parameters))root.querySelector<HTMLInputElement>(`[data-parameter="${name}"]`)!.value=String(value);
  for(const [name,value] of Object.entries(preset.toggles))root.querySelector<HTMLInputElement>(`[data-toggle="${name}"]`)!.checked=value;
  progress=preset.at;recompute();syncPresets();draw();status.textContent=`${preset.label}. ${status.dataset.summary??''}`;
 }));
 root.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(button=>button.addEventListener('click',()=>{pause(false);progress=Number(button.dataset.stage);draw();status.textContent=status.dataset.summary??'';}));
 root.querySelectorAll<HTMLInputElement>('[data-parameter],[data-toggle]').forEach(input=>input.addEventListener('input',()=>{pause(false);recompute();syncPresets();draw();status.textContent=status.dataset.summary??'';}));
 function updateMotion(){pause(false);play.disabled=preference.matches;hint.hidden=!preference.matches;}
 preference.addEventListener('change',updateMotion);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(false);});
 window.addEventListener('pagehide',()=>pause(false));
 const intersection='IntersectionObserver'in window?new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(!visible)pause(false);}):null;
 intersection?.observe(root);
 const resizeObserver='ResizeObserver'in window?new ResizeObserver(resize):null;
 const themeObserver=new MutationObserver(()=>{if(!playing)draw();});
 themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 ui.hidden=false;canvas.hidden=false;fallback.hidden=true;recompute();syncPresets();resize();updateMotion();status.textContent=status.dataset.summary??'';
 resizeObserver?.observe(canvas);if(!resizeObserver)window.addEventListener('resize',resize);
 document.fonts.ready.then(()=>draw());
 window.addEventListener('pagehide',()=>{intersection?.disconnect();resizeObserver?.disconnect();themeObserver.disconnect();});
 window.addEventListener('pageshow',event=>{if(event.persisted){intersection?.observe(root);resizeObserver?.observe(canvas);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});resize();}});
}
function trajectoryPoint(states:Point2[],progress:number){const position=progress*(states.length-1),index=Math.min(states.length-2,Math.floor(position)),fraction=position-index;return {x:lerp(states[index].x,states[index+1].x,fraction),y:lerp(states[index].y,states[index+1].y,fraction)};}
export function initCanvasLabs(){document.querySelectorAll<HTMLElement>('[data-scientific-lab]').forEach(root=>attach(root));}
