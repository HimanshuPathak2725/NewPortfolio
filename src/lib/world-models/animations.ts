import {renderAnimationFrame,animationNotes} from './animated-figures';
import type {LabKind} from '../../data/world-models';

export function initArticleAnimations(){
 document.querySelectorAll<HTMLElement>('[data-animated-figure]').forEach(root=>{
  const kind=root.dataset.animatedFigure as LabKind;
  const svg=root.querySelector<SVGSVGElement>('svg')!,scene=root.querySelector<SVGGElement>('[data-motion-scene]')!;
  const controls=root.querySelector<HTMLElement>('.wm-animation-controls')!,button=root.querySelector<HTMLButtonElement>('[data-motion-toggle]')!,phase=root.querySelector<HTMLElement>('[data-motion-phase]')!;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let compact=false,progress=1,frame=0,previous=0,drawn=0,playing=false,seen=false,inView=false;
  function paint(){const result=renderAnimationFrame(kind,progress,compact);svg.setAttribute('viewBox',`0 0 ${result.width} ${result.height}`);scene.innerHTML=result.markup;if(phase.textContent!==result.phase)phase.textContent=result.phase;}
  function syncButton(){button.textContent=playing?'Pause Ⅱ':progress>=1?'Replay ↻':'Play ▷';button.setAttribute('aria-label',`${playing?'Pause':progress>=1?'Replay':'Play'} ${kind} animation`);}
  function pause(){playing=false;cancelAnimationFrame(frame);frame=0;syncButton();}
  function tick(now:number){if(!playing)return;const delta=Math.min((now-previous)/1000,.1);previous=now;progress=Math.min(1,progress+delta/animationNotes[kind].duration);if(now-drawn>=1000/30||progress===1){paint();drawn=now;}if(progress>=1)pause();else frame=requestAnimationFrame(tick);}
  function play(){if(playing)return;if(progress>=1)progress=0;playing=true;previous=performance.now();paint();syncButton();frame=requestAnimationFrame(tick);}
  button.addEventListener('click',()=>{seen=true;if(playing)pause();else play();});
  function resize(){const next=root.getBoundingClientRect().width<540;if(next!==compact){compact=next;paint();}}
  function motionChanged(){if(reduced.matches){pause();progress=1;paint();syncButton();}}
  reduced.addEventListener('change',motionChanged);
  const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;if(!inView)pause();else if(!seen&&!reduced.matches&&!document.hidden){seen=true;play();}},{threshold:.2}):null;
  const resizer='ResizeObserver'in window?new ResizeObserver(resize):null;
  controls.hidden=false;resize();paint();syncButton();observer?.observe(root);resizer?.observe(root);
  if(!resizer)window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('pagehide',()=>{pause();observer?.disconnect();resizer?.disconnect();});
  window.addEventListener('pageshow',event=>{if(event.persisted){resize();observer?.observe(root);resizer?.observe(root);}});
 });
}
